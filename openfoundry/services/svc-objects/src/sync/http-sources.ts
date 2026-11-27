import type { LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import type { SyncSources } from "./sync-object-type.js";

const segment = encodeURIComponent;

async function getJson<T>(url: string): Promise<T | undefined> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
  return (await res.json()) as T;
}

/** Every item of a Foundry-style `{ data, nextPageToken }` listing. */
async function listAll<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let token: string | undefined;
  do {
    const sep = url.includes("?") ? "&" : "?";
    const page = await getJson<{ data: T[]; nextPageToken?: string }>(
      `${url}${sep}pageSize=500${token ? `&pageToken=${segment(token)}` : ""}`,
    );
    items.push(...(page?.data ?? []));
    token = page?.nextPageToken;
  } while (token);
  return items;
}

/** Sync sources over HTTP: definitions from svc-ontology, files from svc-datasets. */
export function httpSyncSources(ontologyServiceUrl: string, datasetsServiceUrl: string): SyncSources {
  const ontologies = `${ontologyServiceUrl}/api/v2/ontologies`;
  return {
    getObjectType: (rid, objectType) =>
      getJson<ObjectTypeDefinition>(
        `${ontologies}/${segment(rid)}/objectTypes/${segment(objectType)}?includeDatasources=true`,
      ),

    // ponytail: scans every ontology's object types per dataset change; keep
    // a dataset -> object type index if ontologies grow to thousands of types.
    async objectTypesBackedBy(datasetRid) {
      const backed: Array<{ ontologyRid: string; objectType: string }> = [];
      for (const { rid } of await listAll<{ rid: string }>(ontologies)) {
        const types = await listAll<ObjectTypeDefinition>(
          `${ontologies}/${segment(rid)}/objectTypes?includeDatasources=true`,
        );
        for (const type of types) {
          if (type.datasources?.some((d) => d.definition.datasetRid === datasetRid)) {
            backed.push({ ontologyRid: rid, objectType: type.apiName });
          }
        }
      }
      return backed;
    },

    // ponytail: reads every file of the dataset's current view, ignoring
    // `branch` - svc-datasets does not scope files to branches yet.
    async readCsvFiles(datasetRid) {
      const base = `${datasetsServiceUrl}/api/v2/datasets/${segment(datasetRid)}/files`;
      const files = await listAll<{ path: string }>(base);
      const csv = files.filter((f) => f.path.toLowerCase().endsWith(".csv"));
      return Promise.all(
        csv.map(async ({ path }) => {
          const url = `${base}/${path.split("/").map(segment).join("/")}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
          if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
          return { path, text: await res.text() };
        }),
      );
    },
  };
}

/** Where link creation reads link type declarations from. */
export interface LinkTypeSource {
  getLinkType(ontologyRid: string, linkType: string): Promise<LinkTypeDefinition | undefined>;
}

export function httpLinkTypeSource(ontologyServiceUrl: string): LinkTypeSource {
  return {
    getLinkType: (rid, linkType) =>
      getJson<LinkTypeDefinition>(
        `${ontologyServiceUrl}/api/v2/ontologies/${segment(rid)}/linkTypes/${segment(linkType)}`,
      ),
  };
}

/** Which object types implement an interface. */
export interface InterfaceSource {
  /** The implementing object types, or `undefined` if the interface is not declared. */
  implementingObjectTypes(ontologyRid: string, interfaceType: string): Promise<string[] | undefined>;
}

export function httpInterfaceSource(ontologyServiceUrl: string): InterfaceSource {
  const ontologies = `${ontologyServiceUrl}/api/v2/ontologies`;
  return {
    async implementingObjectTypes(rid, interfaceType) {
      const declared = await getJson(`${ontologies}/${segment(rid)}/interfaceTypes/${segment(interfaceType)}`);
      if (!declared) return undefined;
      const types = await listAll<ObjectTypeDefinition>(`${ontologies}/${segment(rid)}/objectTypes`);
      return types.filter((t) => (t.implements ?? []).includes(interfaceType)).map((t) => t.apiName);
    },
  };
}
