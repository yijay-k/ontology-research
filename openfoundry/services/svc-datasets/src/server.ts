import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { OpenFoundryApiError } from "@openfoundry/errors";
import { createPool } from "@openfoundry/db";
import {
  createAuthorizationStore,
  registerAuthorization,
  type AuthorizationStore,
} from "@openfoundry/permissions";
import { type DatasetServiceConfig, loadConfig } from "./config.js";
import { PgConnectivityStore } from "./connectivity/pg-store.js";
import { SecretBox } from "./connectivity/secrets.js";
import { type ConnectivityStore, MemoryConnectivityStore } from "./connectivity/store.js";
import { DatasetStore } from "./store/dataset-store.js";
import { FileStore } from "./store/file-store.js";
import { PipelineStore } from "./store/pipeline-store.js";
import { PgDatasetStore } from "./store/pg-dataset-store.js";
import { PgFileStore } from "./store/pg-file-store.js";
import { PgPipelineStore } from "./store/pg-pipeline-store.js";
import { healthRoutes } from "./routes/health.js";
import { v2Routes } from "./routes/v2/index.js";
import { v1Routes } from "./routes/v1/index.js";

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

/**
 * Routes after which a dataset's current files may differ: uploads, deletes
 * and committed transactions, in both API versions.
 */
const CHANGES_FILES = /\/datasets\/:datasetRid\/(files\/\*|transactions\/:transactionRid\/commit)$/;

/** Tell svc-objects a dataset changed, so the object types it backs resync. */
function notifyObjects(objectsServiceUrl: string) {
  return async (datasetRid: string): Promise<void> => {
    const res = await fetch(
      `${objectsServiceUrl}/internal/datasets/${encodeURIComponent(datasetRid)}/changed`,
      { method: "POST", signal: AbortSignal.timeout(60_000) },
    );
    if (!res.ok) throw new Error(`svc-objects answered ${res.status}`);
  };
}

export interface CreateServerOptions {
  /**
   * Called after a dataset's files change; defaults to notifying svc-objects.
   * Runs after the response is sent, and a failure is only logged.
   */
  onDatasetChanged?: (datasetRid: string) => Promise<void>;

  /** Inject the connectivity store (useful for tests). */
  connectivityStore?: ConnectivityStore;
  /** Inject the grant and policy store (useful for tests). */
  authorizationStore?: AuthorizationStore;
  /** Override the config (useful for tests). */
  config?: DatasetServiceConfig;
  /** Inject an existing dataset store (useful for tests). */
  datasetStore?: DatasetStore | PgDatasetStore;
  /** Inject an existing file store (useful for tests). */
  fileStore?: FileStore | PgFileStore;
  /** Inject an existing pipeline store (useful for tests). */
  pipelineStore?: PipelineStore | PgPipelineStore;
}

/**
 * Build and configure the Fastify server instance for the Dataset service.
 */
export async function createServer(
  options: CreateServerOptions = {},
): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  let authPool: ReturnType<typeof createPool> | undefined;

  let datasetStore: DatasetStore | PgDatasetStore;
  let fileStore: FileStore | PgFileStore;
  let pipelineStore: PipelineStore | PgPipelineStore;
  let connectivityStore: ConnectivityStore;

  if (options.datasetStore && options.fileStore) {
    datasetStore = options.datasetStore;
    fileStore = options.fileStore;
    pipelineStore = options.pipelineStore ?? new PipelineStore();
    connectivityStore =
      options.connectivityStore ?? new MemoryConnectivityStore(SecretBox.fromEnv(process.env, false));
  } else if (config.databaseUrl) {
    const pool = createPool({ connectionString: config.databaseUrl });
    authPool = pool;
    datasetStore = options.datasetStore ?? new PgDatasetStore(pool);
    fileStore = options.fileStore ?? new PgFileStore(pool);
    pipelineStore = options.pipelineStore ?? new PgPipelineStore(pool);
    connectivityStore =
      options.connectivityStore ?? new PgConnectivityStore(pool, SecretBox.fromEnv(process.env, true));
  } else {
    datasetStore = options.datasetStore ?? new DatasetStore();
    fileStore = options.fileStore ?? new FileStore();
    pipelineStore = options.pipelineStore ?? new PipelineStore();
    connectivityStore =
      options.connectivityStore ?? new MemoryConnectivityStore(SecretBox.fromEnv(process.env, false));
  }

  // Seed default pipeline definitions (no-op if pipelines already exist)
  if (pipelineStore instanceof PipelineStore) {
    pipelineStore.seedDefaults();
  }

  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.nodeEnv === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss Z" },
            },
          }
        : {}),
    },
    genReqId: () => crypto.randomUUID(),
    requestIdHeader: "x-request-id",
  });

  // -- CORS ---------------------------------------------------------------
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id", "Accept"],
    exposedHeaders: ["X-Request-Id"],
  });

  // -- Request ID ---------------------------------------------------------
  app.addHook("onSend", async (request, reply) => {
    if (!reply.hasHeader("x-request-id")) {
      reply.header("x-request-id", request.id);
    }
  });

  // -- Error handler ------------------------------------------------------
  app.setErrorHandler((error: Error, request, reply) => {
    if (error instanceof OpenFoundryApiError) {
      request.log.warn(
        { err: error.toJSON(), requestId: request.id },
        error.message,
      );
      return reply.status(error.statusCode).send(error.toJSON());
    }

    // Fastify validation errors
    const fastifyError = error as Error & { validation?: unknown[] };
    if (fastifyError.validation) {
      const body = {
        errorCode: "INVALID_ARGUMENT",
        errorName: "ValidationError",
        errorInstanceId: crypto.randomUUID(),
        parameters: { validationErrors: fastifyError.validation },
        statusCode: 400,
      };
      request.log.warn({ err: body, requestId: request.id }, error.message);
      return reply.status(400).send(body);
    }

    // Unexpected errors
    request.log.error(
      { err: error, requestId: request.id },
      "Unhandled error",
    );
    return reply.status(500).send({
      errorCode: "INTERNAL",
      errorName: "InternalError",
      errorInstanceId: crypto.randomUUID(),
      parameters: {},
      statusCode: 500,
    });
  });

  // -- Dataset change notifications --------------------------------------
  // Like Palantir's live indexing pipelines, which run on each source update,
  // a change to a dataset's files triggers a resync of the object types it
  // backs. Fire-and-forget: the write has already succeeded.
  const onDatasetChanged = options.onDatasetChanged ?? notifyObjects(config.objectsServiceUrl);
  app.addHook("onResponse", async (request, reply) => {
    if (request.method === "GET" || reply.statusCode >= 300) return;
    if (!CHANGES_FILES.test(request.routeOptions.url ?? "")) return;
    const { datasetRid } = request.params as { datasetRid: string };
    onDatasetChanged(datasetRid).catch((err) =>
      request.log.warn({ err, datasetRid }, "could not trigger object sync for dataset"),
    );
  });

  // -- Routes -------------------------------------------------------------
  registerAuthorization(app, {
    store: options.authorizationStore ?? createAuthorizationStore(authPool),
  });

  await app.register(healthRoutes);
  await app.register(v2Routes, {
    prefix: "/api/v2",
    datasetStore: datasetStore as DatasetStore,
    fileStore,
    pipelineStore: pipelineStore as PipelineStore,
    connectivityStore,
  });
  await app.register(v1Routes, {
    prefix: "/api/v1",
    datasetStore,
    fileStore,
  });

  return app;
}
