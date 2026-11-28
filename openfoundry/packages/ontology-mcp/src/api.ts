/**
 * The slice of the public v2 API the MCP tools read. Everything goes through
 * the gateway with the caller's bearer token, so the tools see exactly what
 * that caller may see: permissions are enforced by the platform, not here.
 */

export interface PropertyShape {
  type?: string;
  description?: string;
  editable?: boolean;
}

export interface ObjectTypeShape {
  apiName: string;
  displayName?: string;
  description?: string;
  agentDescription?: string;
  status?: string;
  primaryKeyApiName?: string;
  primaryKey?: string;
  properties?: Record<string, PropertyShape>;
}

export interface ActionTypeShape {
  apiName: string;
  description?: string;
  agentDescription?: string;
  status?: string;
  parameters?: Record<string, { type?: string; required?: boolean; description?: string }>;
  modifiedEntities?: Record<string, { created?: boolean; modified?: boolean }>;
}

export interface LinkTypeShape {
  apiName: string;
  objectTypeApiName: string;
  linkedObjectTypeApiName: string;
  cardinality?: string;
}

export interface OntologyMetadata {
  rid: string;
  apiName: string;
  displayName?: string;
  objectTypes: ObjectTypeShape[];
  actionTypes: ActionTypeShape[];
  linkTypes: LinkTypeShape[];
}

export interface LoadObjectsRequest {
  objectSet: Record<string, unknown>;
  select: string[];
  pageSize: number;
  pageToken?: string;
  orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
}

export interface LoadObjectsResponse {
  data: Array<{ primaryKey: string; properties: Record<string, unknown> }>;
  totalCount?: number;
  nextPageToken?: string;
}

export interface OntologyApi {
  listOntologies(): Promise<Array<{ rid: string; apiName: string; displayName?: string }>>;
  metadata(ontologyRid: string): Promise<OntologyMetadata>;
  loadObjects(ontologyRid: string, request: LoadObjectsRequest): Promise<LoadObjectsResponse>;
}

/** A list that the services answer either bare or as `{ data }` / `{ items }`. */
function listOf<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const v = value as { data?: unknown; items?: unknown } | undefined;
  if (Array.isArray(v?.data)) return v.data as T[];
  if (Array.isArray(v?.items)) return v.items as T[];
  return [];
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    const name = (body as { errorName?: string } | undefined)?.errorName;
    super(`openfoundry answered ${status}${name ? ` ${name}` : ""}`);
  }
}

export function httpOntologyApi(baseUrl: string, token?: string): OntologyApi {
  const headers = (json: boolean): Record<string, string> => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
  });
  const call = async (path: string, body?: unknown) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: headers(body !== undefined),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15_000),
    });
    const parsed = await res.json().catch(() => undefined);
    if (!res.ok) throw new ApiError(res.status, parsed);
    return parsed;
  };
  const seg = encodeURIComponent;
  return {
    async listOntologies() {
      return listOf(await call("/api/v2/ontologies"));
    },
    async metadata(rid) {
      const m = (await call(`/api/v2/ontologies/${seg(rid)}/fullMetadata`)) as Record<string, unknown>;
      return {
        rid: (m.rid as string) ?? rid,
        apiName: (m.apiName as string) ?? rid,
        displayName: m.displayName as string | undefined,
        objectTypes: listOf<ObjectTypeShape>(m.objectTypes),
        actionTypes: listOf<ActionTypeShape>(m.actionTypes),
        linkTypes: listOf<LinkTypeShape>(m.linkTypes),
      };
    },
    async loadObjects(rid, request) {
      return (await call(`/api/v2/ontologies/${seg(rid)}/objectSets/loadObjects`, request)) as LoadObjectsResponse;
    },
  };
}
