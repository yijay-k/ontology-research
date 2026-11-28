/**
 * Ossie export and import: `/api/v2/ontologies/:ontologyRid/ossie`.
 *
 * Not a Foundry endpoint - an openfoundry extension under the ontology's path,
 * which the gateway already routes here. See `../../ossie.ts` for the mapping.
 */
import type { FastifyInstance } from "fastify";
import yaml from "js-yaml";
import { OpenFoundryApiError, invalidArgument } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import type { LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import type { OntologyStore } from "../../store/ontology-store.js";
import { fromOssie, toOssie, type OssieModel } from "../../ossie.js";

/** The stores answer a list bare or as `{ items }`; take either. */
function listOf<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return ((value as { items?: T[] } | undefined)?.items ?? []) as T[];
}

const wantsYaml = (accept: string | undefined, format: string | undefined) =>
  format === "yaml" || /\b(application|text)\/(x-)?yaml\b/.test(accept ?? "");

export async function ossieRoutes(app: FastifyInstance, opts: { store: OntologyStore }): Promise<void> {
  const { store } = opts;

  // YAML is how Ossie documents are usually written; accept it as a body.
  app.addContentTypeParser(/^(application|text)\/(x-)?yaml/, { parseAs: "string" }, (_req, body, done) => {
    try {
      done(null, yaml.load(body as string));
    } catch (err) {
      done(invalidArgument("body", `is not valid YAML: ${(err as Error).message}`), undefined);
    }
  });

  app.get<{ Params: { ontologyRid: string }; Querystring: { format?: string } }>(
    "/ontologies/:ontologyRid/ossie",
    { preHandler: requirePermission("ontology:read") },
    async (request, reply) => {
      const rid = request.params.ontologyRid;
      const [ontology, objectTypes, linkTypes] = await Promise.all([
        store.getOntology(rid),
        Promise.resolve(store.listObjectTypes(rid)),
        Promise.resolve(store.listLinkTypes(rid)),
      ]);
      const { model, skipped } = toOssie(
        ontology as { apiName: string; description?: string },
        listOf<ObjectTypeDefinition>(objectTypes),
        listOf<LinkTypeDefinition>(linkTypes),
      );
      if (skipped.length) reply.header("x-ossie-skipped", String(skipped.length));
      if (wantsYaml(request.headers.accept, request.query.format)) {
        return reply.type("application/yaml").send(yaml.dump(model, { noRefs: true, lineWidth: 120 }));
      }
      return { ...model, ...(skipped.length ? { nonportable_extensions: [{ vendor_name: "OPENFOUNDRY", data: { skipped } }] } : {}) };
    },
  );

  app.post<{ Params: { ontologyRid: string }; Querystring: { dryRun?: string }; Body: unknown }>(
    "/ontologies/:ontologyRid/ossie",
    { preHandler: requirePermission("ontology:write") },
    async (request) => {
      const rid = request.params.ontologyRid;
      let plan;
      try {
        plan = fromOssie(request.body as OssieModel);
      } catch (err) {
        throw invalidArgument("body", (err as Error).message);
      }
      const skipped = [...plan.skipped];
      const existingTypes = new Set(listOf<ObjectTypeDefinition>(await store.listObjectTypes(rid)).map((t) => t.apiName));
      const existingLinks = new Set(listOf<LinkTypeDefinition>(await store.listLinkTypes(rid)).map((l) => l.apiName));
      const types = plan.objectTypes.filter((t) => {
        if (!existingTypes.has(t.apiName)) return true;
        skipped.push(`dataset ${t.apiName}: an object type of that name exists; it was left unchanged`);
        return false;
      });
      const links = plan.linkTypes.filter((l) => {
        if (!existingLinks.has(l.apiName)) return true;
        skipped.push(`relationship ${l.apiName}: a link type of that name exists; it was left unchanged`);
        return false;
      });

      if (request.query.dryRun === "true") {
        return { dryRun: true, objectTypes: types, linkTypes: links, skipped };
      }
      const created = { objectTypes: [] as string[], linkTypes: [] as string[] };
      for (const t of types) {
        await store.createObjectType(rid, t);
        created.objectTypes.push(t.apiName);
      }
      for (const l of links) {
        try {
          await store.createLinkType(rid, l);
          created.linkTypes.push(l.apiName);
        } catch (err) {
          if (!(err instanceof OpenFoundryApiError)) throw err;
          skipped.push(`relationship ${l.apiName}: ${err.message}`);
        }
      }
      return { dryRun: false, created, skipped };
    },
  );
}
