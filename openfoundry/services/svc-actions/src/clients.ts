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

/** Where action and object type definitions are read from: svc-ontology. */
export interface OntologySource {
  getActionType(ontologyRid: string, apiName: string): Promise<ActionTypeDefinition | undefined>;
  getObjectType(ontologyRid: string, apiName: string): Promise<ObjectTypeDefinition | undefined>;
}

/** Where objects are read from and an edit plan is committed: svc-objects. */
export interface ObjectsGateway {
  /** An object's properties and version, or `undefined` when it does not exist. */
  getObject(ontologyRid: string, objectType: string, primaryKey: string): Promise<ReadObject | undefined>;
  /** Commit every edit or none; a stale `expectedVersion` fails with `ObjectChanged`. */
  applyEdits(ontologyRid: string, edits: ObjectEdit[]): Promise<void>;
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
    async applyEdits(rid, edits) {
      const url = `${baseUrl}/internal/ontologies/${segment(rid)}/edits`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        // Pass svc-objects' error through (ObjectChanged, ObjectNotFound, ...)
        // rather than flattening it into a 500.
        const body = (await res.json().catch(() => undefined)) as ErrorResponse["body"];
        throw OpenFoundryApiError.fromResponse({ status: res.status, body });
      }
    },
  };
}
