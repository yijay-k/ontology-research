import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { OpenFoundryApiError } from "@openfoundry/errors";
import { createPool } from "@openfoundry/db";
import {
  createAuthorizationStore,
  registerAuthorization,
  type AuthorizationStore,
} from "@openfoundry/permissions";
import { type ActionsConfig, loadConfig } from "./config.js";
import { ActionLog, type ActionExecutionLog } from "./store/action-log.js";
import { PgActionLog } from "./store/pg-action-log.js";
import { MemoryProposalStore, type ProposalStore } from "./store/proposals.js";
import { PgProposalStore } from "./store/pg-proposals.js";
import { proposalRoutes } from "./routes/v2/proposals.js";
import { healthRoutes } from "./routes/health.js";
import { actionRoutes } from "./routes/v2/actions.js";
import { v1Routes } from "./routes/v1/index.js";
import {
  httpObjectsGateway,
  httpOntologySource,
  type ObjectsGateway,
  type OntologySource,
} from "./clients.js";
import { ACTION_LOGIC, type ActionLogic } from "./logic.js";

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export interface CreateServerOptions {
  /** Inject the grant and policy store (useful for tests). */
  authorizationStore?: AuthorizationStore;
  /** Override the config (useful for tests). */
  config?: ActionsConfig;

  /** Where action and object type definitions come from; defaults to svc-ontology over HTTP. */
  ontology?: OntologySource;

  /** Where objects are read and edits committed; defaults to svc-objects over HTTP. */
  objects?: ObjectsGateway;

  /** Logic per action type API name; defaults to the pest-control demo logic. */
  logic?: Readonly<Record<string, ActionLogic>>;

  /** Provide an action log (useful for tests). */
  actionLog?: ActionExecutionLog;

  /** Where proposals of actions that require approval are kept. */
  proposals?: ProposalStore;
}

/**
 * Build and configure the Fastify server instance for the Actions service.
 */
export async function createServer(
  options: CreateServerOptions = {},
): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  let authPool: ReturnType<typeof createPool> | undefined;

  let actionLog: ActionExecutionLog;
  if (options.actionLog) {
    actionLog = options.actionLog;
  } else if (config.databaseUrl) {
    authPool = createPool({ connectionString: config.databaseUrl });
    actionLog = new PgActionLog(authPool);
  } else {
    actionLog = new ActionLog();
  }

  const deps = {
    ontology: options.ontology ?? httpOntologySource(config.ontologyServiceUrl),
    objects: options.objects ?? httpObjectsGateway(config.objectsServiceUrl),
    logic: options.logic ?? ACTION_LOGIC,
    log: actionLog,
    proposals:
      options.proposals ?? (config.databaseUrl ? new PgProposalStore(authPool ?? createPool({ connectionString: config.databaseUrl })) : new MemoryProposalStore()),
  };

  const app = Fastify({
    logger: {
      level: config.logLevel,
      ...(config.nodeEnv === "development"
        ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss Z" } } }
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

  // -- Routes -------------------------------------------------------------
  registerAuthorization(app, {
    store: options.authorizationStore ?? createAuthorizationStore(authPool),
  });

  await app.register(healthRoutes);
  await app.register(actionRoutes, { prefix: "/api/v2", ...deps });
  await app.register(proposalRoutes, { prefix: "/api/v2", ...deps });
  await app.register(v1Routes, { prefix: "/api/v1", ...deps });

  return app;
}
