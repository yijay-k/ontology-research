import type {
  ActionTypeDefinition,
  ObjectTypeDefinition,
} from "@openfoundry/ontology-schema";
import { OpenFoundryApiError, type ErrorResponse } from "@openfoundry/errors";

/**
 * One object edit, as an action's logic describes it and svc-objects commits
 * it. The `type` names are Foundry's `ObjectEdit` variants.
 */
export type ObjectEdit =
  | { type: "addObject"; objectType: string; primaryKey: string; properties: Record<string, unknown> }
  | {
      type: "modifyObject";
      objectType: string;
      primaryKey: string;
      properties: Record<string, unknown>;
      expectedVersion?: number;
    }
  | { type: "deleteObject"; objectType: string; primaryKey: string; expectedVersion?: number };

/** An object as action logic reads it: its properties and the version they are at. */
export interface ReadObject {
  properties: Record<string, unknown>;
  version: number;
}

/** An object the logic read but the plan does not write, at the version read. */
export interface ReadVersion {
  objectType: string;
  primaryKey: string;
  version: number;
}

/** What is committed beside the edits, in svc-objects' one transaction. */
export interface CommitOptions {
  idempotencyKey?: string;
  reads?: ReadVersion[];
  actionType?: string;
  actor?: string;
}

export interface CommitResult {
  commitId: string;
  /** The idempotency key had already committed; nothing was applied. */
  replayed: boolean;
}

/** A committed plan, found by its idempotency key. */
export interface StoredCommit {
  commitId: string;
  edits: ObjectEdit[];
}

/** Where action and object type definitions are read from: svc-ontology. */
export interface OntologySource {
  getActionType(ontologyRid: string, apiName: string): Promise<ActionTypeDefinition | undefined>;
  getObjectType(ontologyRid: string, apiName: string): Promise<ObjectTypeDefinition | undefined>;
}

/** Where objects are read from and an edit plan is committed: svc-objects. */
export interface ObjectsGateway {
  /** An object's properties and version, or `undefined` when it does not exist. */
  getObject(ontologyRid: string, objectType: string, primaryKey: string): Promise<ReadObject | undefined>;
  /**
   * Commit every edit or none, with the commit log row and outbox event; a
   * stale `expectedVersion` or changed read fails with `ObjectChanged`.
   */
  applyEdits(ontologyRid: string, edits: ObjectEdit[], options?: CommitOptions): Promise<CommitResult>;
  /** The commit an idempotency key produced, or `undefined`. */
  getCommit(ontologyRid: string, idempotencyKey: string): Promise<StoredCommit | undefined>;
}

async function getJson<T>(url: string): Promise<T | undefined> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
  return (await res.json()) as T;
}

const segment = encodeURIComponent;

export function httpOntologySource(baseUrl: string): OntologySource {
  const base = (rid: string) => `${baseUrl}/api/v2/ontologies/${segment(rid)}`;
  return {
    getActionType: (rid, apiName) =>
      getJson<ActionTypeDefinition>(`${base(rid)}/actionTypes/${segment(apiName)}`),
    getObjectType: (rid, apiName) =>
      getJson<ObjectTypeDefinition>(`${base(rid)}/objectTypes/${segment(apiName)}`),
  };
}

export function httpObjectsGateway(baseUrl: string): ObjectsGateway {
  return {
    getObject: (rid, objectType, primaryKey) =>
      getJson<ReadObject>(
        `${baseUrl}/internal/ontologies/${segment(rid)}/objects/${segment(objectType)}/${segment(primaryKey)}`,
      ),
    getCommit: (rid, idempotencyKey) =>
      getJson<StoredCommit>(`${baseUrl}/internal/ontologies/${segment(rid)}/commits/${segment(idempotencyKey)}`),
    async applyEdits(rid, edits, options = {}) {
      const url = `${baseUrl}/internal/ontologies/${segment(rid)}/edits`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits, ...options }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        // Pass svc-objects' error through (ObjectChanged, ObjectNotFound, ...)
        // rather than flattening it into a 500.
        const body = (await res.json().catch(() => undefined)) as ErrorResponse["body"];
        throw OpenFoundryApiError.fromResponse({ status: res.status, body });
      }
      return (await res.json()) as CommitResult;
    },
  };
}
