/**
 * Cold-start drafting: `POST /api/v2/ontologies/:ontologyRid/drafts/fromDatasets`.
 *
 * Profiles each named dataset's CSV files and proposes dataset-backed object
 * types plus the links the data confirms (`@openfoundry/ontology-drafting`).
 * By default it only answers the proposal, in the shapes the object type and
 * link type routes accept; `?apply=true` also creates them, as EXPERIMENTAL
 * drafts a person promotes later. Not a Foundry endpoint.
 */
import type { FastifyInstance } from "fastify";
import { invalidArgument } from "@openfoundry/errors";
import { generateRid } from "@openfoundry/rid";
import { requirePermission } from "@openfoundry/permissions";
import type { LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { draftOntology, parseCSV, profileTable, type DraftSource } from "@openfoundry/ontology-drafting";
import type { OntologyStore } from "../../store/ontology-store.js";

/** Where drafting reads a dataset's name and CSV files from. */
export interface DatasetReader {
  read(datasetRid: string): Promise<{ name: string; csvFiles: Array<{ path: string; text: string }> }>;
}

export function httpDatasetReader(datasetsServiceUrl: string): DatasetReader {
  const seg = encodeURIComponent;
  const get = async (url: string) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw invalidArgument("datasetRid", `${url} answered ${res.status}`);
    return res;
  };
  return {
    async read(rid) {
      const base = `${datasetsServiceUrl}/api/v2/datasets/${seg(rid)}`;
      const dataset = (await (await get(base)).json()) as { name?: string };
      const files: Array<{ path: string }> = [];
      let token: string | undefined;
      do {
        const page = (await (await get(`${base}/files?pageSize=500${token ? `&pageToken=${seg(token)}` : ""}`)).json()) as {
          data?: Array<{ path: string }>;
          nextPageToken?: string;
        };
        files.push(...(page.data ?? []));
        token = page.nextPageToken;
      } while (token);
      const csvFiles = await Promise.all(
        files
          .filter((f) => f.path.toLowerCase().endsWith(".csv"))
          .map(async ({ path }) => ({ path, text: await (await get(`${base}/files/${path.split("/").map(seg).join("/")}`)).text() })),
      );
      return { name: dataset.name ?? rid, csvFiles };
    },
  };
}

const listOf = <T>(v: unknown): T[] => (Array.isArray(v) ? v : ((v as { items?: T[] })?.items ?? [])) as T[];

export async function draftRoutes(
  app: FastifyInstance,
  opts: { store: OntologyStore; datasets: DatasetReader },
): Promise<void> {
  const { store, datasets } = opts;

  app.post<{ Params: { ontologyRid: string }; Querystring: { apply?: string }; Body: { datasets?: Array<{ datasetRid?: string }> } }>(
    "/ontologies/:ontologyRid/drafts/fromDatasets",
    { preHandler: requirePermission("ontology:write") },
    async (request) => {
      const rid = request.params.ontologyRid;
      const wanted = request.body?.datasets;
      if (!Array.isArray(wanted) || wanted.length === 0 || !wanted.every((d) => typeof d?.datasetRid === "string")) {
        throw invalidArgument("datasets", "must be a non-empty array of { datasetRid }");
      }
      await store.getOntology(rid);

      const sources: DraftSource[] = [];
      const skipped: string[] = [];
      for (const { datasetRid } of wanted as Array<{ datasetRid: string }>) {
        const { name, csvFiles } = await datasets.read(datasetRid);
        if (csvFiles.length === 0) {
          skipped.push(`${name}: the dataset has no CSV files`);
          continue;
        }
        // Files of one dataset share a header; the first file's header governs.
        const [first, ...rest] = csvFiles.map((f) => parseCSV(f.text));
        const table = [...first, ...rest.flatMap((t) => t.slice(1))];
        sources.push({ datasetRid, profile: profileTable(name, table) });
      }
      const draft = draftOntology(sources);
      draft.skipped.unshift(...skipped);

      if (request.query.apply !== "true") return { applied: false, ...draft };

      const existingTypes = new Set(listOf<ObjectTypeDefinition>(await store.listObjectTypes(rid)).map((t) => t.apiName));
      const existingLinks = new Set(listOf<LinkTypeDefinition>(await store.listLinkTypes(rid)).map((l) => l.apiName));
      const created = { objectTypes: [] as string[], linkTypes: [] as string[] };
      for (const t of draft.objectTypes as unknown as ObjectTypeDefinition[]) {
        if (existingTypes.has(t.apiName)) {
          draft.skipped.push(`${t.apiName}: an object type of that name exists; it was left unchanged`);
          continue;
        }
        // As the object type route's normalize does: every datasource gets a RID.
        await store.createObjectType(rid, {
          ...t,
          datasources: t.datasources?.map((d) => ({ ...d, rid: d.rid || generateRid("ontology", "datasource").toString() })),
        });
        created.objectTypes.push(t.apiName);
      }
      for (const l of draft.linkTypes as unknown as LinkTypeDefinition[]) {
        if (existingLinks.has(l.apiName) || !created.objectTypes.includes(l.objectTypeApiName)) {
          draft.skipped.push(`${l.apiName}: not created (exists, or its source type was not created)`);
          continue;
        }
        await store.createLinkType(rid, l);
        created.linkTypes.push(l.apiName);
      }
      return { applied: true, created, ...draft };
    },
  );
}
