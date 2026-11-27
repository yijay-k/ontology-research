/**
 * Server configuration for the Object Storage & Query service.
 */
export interface ObjectsConfig {
  readonly port: number;
  readonly host: string;
  readonly logLevel: string;

  /** PostgreSQL connection string.  When set, the PG store is used instead of in-memory. */
  readonly databaseUrl?: string;

  /** Base URL of svc-aip for embedding and semantic search proxying. */
  readonly aipServiceUrl?: string;

  /** Base URL of svc-ontology, read for dataset-backed object type definitions. */
  readonly ontologyServiceUrl?: string;

  /** Base URL of svc-datasets, read for the files that back object types. */
  readonly datasetsServiceUrl?: string;
}

function env(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: "${raw}"`);
  }
  return parsed;
}

export function loadConfig(): ObjectsConfig {
  return {
    port: envInt("PORT", 8082),
    host: env("HOST", "0.0.0.0"),
    logLevel: env("LOG_LEVEL", "info"),
    databaseUrl: process.env.DATABASE_URL || undefined,
    aipServiceUrl: process.env.AIP_SERVICE_URL || undefined,
    ontologyServiceUrl: process.env.ONTOLOGY_SERVICE_URL || undefined,
    datasetsServiceUrl: process.env.DATASETS_SERVICE_URL || undefined,
  };
}
