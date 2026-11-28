/**
 * An MCP server over the ontology, modelled on NVIDIA Auto Ontology's read
 * tools (check_readiness, search, get, check_answerable, query) plus metric
 * queries. Write tools - validate_action and apply_action - exist only when
 * `enableActions` is set (research R14: write tools off by default). They go
 * through svc-actions like any caller: validated, governed, and staged as a
 * proposal when the action type requires approval.
 *
 * ponytail: one generic apply tool rather than one tool per action type, since
 * tools are fixed when the server connects; list_actions describes each
 * action's parameters and svc-actions validates them. Register per-type tools
 * if a client needs typed schemas.
 *
 * What an agent sees is narrowed twice. The platform's permissions apply to
 * every call, since they go through the gateway with the caller's token. On
 * top, only ACTIVE definitions are shown unless the server is configured to
 * include EXPERIMENTAL ones: an experimental type may change or vanish, and
 * an agent should not build answers on it.
 */
import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { checkAnswerable, terms } from "./answerability.js";
import { ApiError, type OntologyApi, type OntologyMetadata, type ObjectTypeShape } from "./api.js";

export interface OntologyMcpOptions {
  api: OntologyApi;
  /** Ontology apiName or RID to serve; otherwise the only one visible, or the tool's `ontology` argument. */
  ontology?: string;
  /** Show EXPERIMENTAL definitions too. DEPRECATED ones are never shown. */
  includeExperimental?: boolean;
  /** Offer validate_action and apply_action. Off by default. */
  enableActions?: boolean;
}

/** Most characters one tool result may hold, as NVIDIA caps observations. */
const MAX_RESULT_CHARS = 8_000;
const MAX_PAGE_SIZE = 100;

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

function ok(value: unknown): ToolResult {
  let text = JSON.stringify(value, null, 2);
  if (text.length > MAX_RESULT_CHARS) {
    text = `${text.slice(0, MAX_RESULT_CHARS)}\n… truncated at ${MAX_RESULT_CHARS} characters; select fewer properties or lower pageSize.`;
  }
  return { content: [{ type: "text", text }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

const described = (d: { description?: string; agentDescription?: string }) => d.agentDescription || d.description || "";
const keyOf = (t: ObjectTypeShape) => t.primaryKeyApiName ?? t.primaryKey;

export function createOntologyMcpServer(options: OntologyMcpOptions): McpServer {
  const { api } = options;
  const visible = (status?: string) =>
    status === "ACTIVE" || (options.includeExperimental === true && (status === undefined || status === "EXPERIMENTAL"));

  async function resolveOntology(arg?: string): Promise<OntologyMetadata> {
    const wanted = arg ?? options.ontology;
    const all = await api.listOntologies();
    const match = wanted ? all.find((o) => o.rid === wanted || o.apiName === wanted) : all.length === 1 ? all[0] : undefined;
    if (!match) {
      throw new Error(
        wanted
          ? `No ontology "${wanted}" is visible to this caller.`
          : `Several ontologies are visible (${all.map((o) => o.apiName).join(", ")}); pass "ontology".`,
      );
    }
    const metadata = await api.metadata(match.rid);
    return {
      ...metadata,
      objectTypes: metadata.objectTypes.filter((t) => visible(t.status)),
      actionTypes: metadata.actionTypes.filter((a) => visible(a.status)),
    };
  }

  /** Run a tool body, turning failures into an MCP error result the model can read. */
  const guarded = <A>(body: (args: A) => Promise<ToolResult>) => async (args: A): Promise<ToolResult> => {
    try {
      return await body(args);
    } catch (err) {
      if (err instanceof ApiError) {
        const reason = (err.body as { parameters?: Record<string, unknown> } | undefined)?.parameters;
        return fail(`${err.message}${reason ? `: ${JSON.stringify(reason)}` : ""}`);
      }
      return fail(err instanceof Error ? err.message : String(err));
    }
  };

  const ontologyArg = z.string().optional().describe("Ontology apiName or RID; omit when only one is visible");
  const server = new McpServer({ name: "openfoundry-ontology", version: "0.1.0" });

  server.registerTool(
    "check_readiness",
    {
      description: "Can this deployment answer anything? Lists visible ontologies and how many usable object and action types each has.",
      inputSchema: z.object({}),
    },
    guarded(async () => {
      const all = await api.listOntologies();
      const ontologies = [];
      for (const o of all) {
        const m = await api.metadata(o.rid);
        ontologies.push({
          apiName: o.apiName,
          rid: o.rid,
          objectTypes: m.objectTypes.filter((t) => visible(t.status)).length,
          actionTypes: m.actionTypes.filter((a) => visible(a.status)).length,
          hiddenObjectTypes: m.objectTypes.filter((t) => !visible(t.status)).length,
        });
      }
      const ready = ontologies.some((o) => o.objectTypes > 0);
      return ok({
        ready,
        ontologies,
        ...(ready ? {} : { reason: "No ACTIVE object types are visible. Definitions must be promoted to ACTIVE before agents use them." }),
      });
    }),
  );

  server.registerTool(
    "search_types",
    {
      description: "Find object types by meaning words in their names, properties and descriptions. Use before get_type.",
      inputSchema: z.object({ query: z.string().min(1), ontology: ontologyArg }),
    },
    guarded(async ({ query, ontology }: { query: string; ontology?: string }) => {
      const m = await resolveOntology(ontology);
      const wanted = new Set(terms(query));
      const scored = m.objectTypes
        .map((t) => {
          const names = new Set([...terms(t.apiName), ...terms(t.displayName ?? ""), ...Object.keys(t.properties ?? {}).flatMap(terms)]);
          const prose = new Set(terms(described(t)));
          let score = 0;
          for (const w of wanted) score += names.has(w) ? 2 : prose.has(w) ? 1 : 0;
          return { t, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score || a.t.apiName.localeCompare(b.t.apiName))
        .slice(0, 10);
      return ok({
        ontology: m.apiName,
        results: scored.map(({ t, score }) => ({ apiName: t.apiName, displayName: t.displayName, description: described(t), score })),
      });
    }),
  );

  server.registerTool(
    "get_type",
    {
      description: "An object type's properties (with types and whether actions may edit them), primary key, links and the actions that change it.",
      inputSchema: z.object({ objectType: z.string().min(1), ontology: ontologyArg }),
    },
    guarded(async ({ objectType, ontology }: { objectType: string; ontology?: string }) => {
      const m = await resolveOntology(ontology);
      const t = m.objectTypes.find((x) => x.apiName === objectType);
      if (!t) return fail(`No visible object type "${objectType}". Use search_types.`);
      return ok({
        apiName: t.apiName,
        displayName: t.displayName,
        description: described(t),
        status: t.status,
        primaryKey: keyOf(t),
        properties: Object.fromEntries(
          Object.entries(t.properties ?? {}).map(([name, p]) => [
            name,
            { type: p.type, ...(p.description ? { description: p.description } : {}), ...(p.editable === false ? { editable: false } : {}) },
          ]),
        ),
        links: [
          ...m.linkTypes.filter((l) => l.objectTypeApiName === t.apiName).map((l) => ({ link: l.apiName, to: l.linkedObjectTypeApiName, cardinality: l.cardinality })),
          ...m.linkTypes.filter((l) => l.linkedObjectTypeApiName === t.apiName).map((l) => ({ link: l.apiName, from: l.objectTypeApiName, cardinality: l.cardinality })),
        ],
        metrics: Object.entries(t.metrics ?? {}).map(([name, mt]) => ({
          name,
          ...(mt.description ? { description: mt.description } : {}),
          measure: mt.measure,
          ...(mt.timeProperty ? { timeProperty: mt.timeProperty } : {}),
          ...(mt.unit ? { unit: mt.unit } : {}),
        })),
        actions: m.actionTypes
          .filter((a) => a.modifiedEntities?.[t.apiName])
          .map((a) => ({ apiName: a.apiName, creates: !!a.modifiedEntities?.[t.apiName]?.created, modifies: !!a.modifiedEntities?.[t.apiName]?.modified })),
      });
    }),
  );

  server.registerTool(
    "list_actions",
    {
      description: "The actions that change data, with their parameters. Read-only: this server cannot run them.",
      inputSchema: z.object({ objectType: z.string().optional(), ontology: ontologyArg }),
    },
    guarded(async ({ objectType, ontology }: { objectType?: string; ontology?: string }) => {
      const m = await resolveOntology(ontology);
      return ok({
        ontology: m.apiName,
        actions: m.actionTypes
          .filter((a) => !objectType || a.modifiedEntities?.[objectType])
          .map((a) => ({ apiName: a.apiName, description: described(a), parameters: a.parameters ?? {}, modifies: Object.keys(a.modifiedEntities ?? {}) })),
      });
    }),
  );

  server.registerTool(
    "check_answerable",
    {
      description:
        "Does the ontology cover this question? Call before querying. If the verdict is not_answerable, tell the user what is missing instead of guessing.",
      inputSchema: z.object({ question: z.string().min(1), ontology: ontologyArg }),
    },
    guarded(async ({ question, ontology }: { question: string; ontology?: string }) => {
      const m = await resolveOntology(ontology);
      return ok({ ontology: m.apiName, ...checkAnswerable(question, m.objectTypes, m.actionTypes) });
    }),
  );

  server.registerTool(
    "query_objects",
    {
      description:
        "Read objects of one type. `select` is required: name only the properties you need. `where` is a Foundry object-set filter, e.g. {\"type\":\"gt\",\"field\":\"amount\",\"value\":1000}. Pages of at most 100; follow nextPageToken.",
      inputSchema: z.object({
        objectType: z.string().min(1),
        select: z.array(z.string().min(1)).min(1),
        where: z.record(z.string(), z.unknown()).optional(),
        orderBy: z.array(z.object({ field: z.string(), direction: z.enum(["asc", "desc"]) })).optional(),
        pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
        pageToken: z.string().optional(),
        ontology: ontologyArg,
      }),
    },
    guarded(async (args: {
      objectType: string;
      select: string[];
      where?: Record<string, unknown>;
      orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
      pageSize?: number;
      pageToken?: string;
      ontology?: string;
    }) => {
      const m = await resolveOntology(args.ontology);
      const t = m.objectTypes.find((x) => x.apiName === args.objectType);
      if (!t) return fail(`No visible object type "${args.objectType}". Use search_types.`);
      const unknown = args.select.filter((p) => !Object.hasOwn(t.properties ?? {}, p) && p !== keyOf(t));
      if (unknown.length > 0) return fail(`${args.objectType} has no properties ${unknown.join(", ")}. Use get_type.`);
      const base = { type: "base", objectType: args.objectType };
      const page = await api.loadObjects(m.rid, {
        objectSet: args.where ? { type: "filter", objectSet: base, where: args.where } : base,
        select: args.select,
        pageSize: args.pageSize ?? 25,
        ...(args.orderBy ? { orderBy: args.orderBy } : {}),
        ...(args.pageToken ? { pageToken: args.pageToken } : {}),
      });
      return ok({
        objectType: args.objectType,
        totalCount: page.totalCount,
        rows: page.data.map((o) => ({ primaryKey: o.primaryKey, ...o.properties })),
        ...(page.nextPageToken ? { nextPageToken: page.nextPageToken } : {}),
      });
    }),
  );

  server.registerTool(
    "query_metric",
    {
      description:
        "Compute a governed metric declared on an object type (see get_type). Choose a period (from/to, ISO dates), a grain (day, week, month, quarter, year) and groupBy properties or link.property paths across one-to-one links.",
      inputSchema: z.object({
        objectType: z.string().min(1),
        metric: z.string().min(1),
        from: z.string().optional(),
        to: z.string().optional(),
        grain: z.enum(["day", "week", "month", "quarter", "year"]).optional(),
        groupBy: z.array(z.string().min(1)).optional(),
        ontology: ontologyArg,
      }),
    },
    guarded(async (args: { objectType: string; metric: string; from?: string; to?: string; grain?: string; groupBy?: string[]; ontology?: string }) => {
      const m = await resolveOntology(args.ontology);
      if (!m.objectTypes.some((t) => t.apiName === args.objectType)) return fail(`No visible object type "${args.objectType}".`);
      return ok(
        await api.queryMetric(m.rid, {
          objectType: args.objectType,
          metric: args.metric,
          ...(args.from ? { from: args.from } : {}),
          ...(args.to ? { to: args.to } : {}),
          ...(args.grain ? { grain: args.grain } : {}),
          ...(args.groupBy ? { groupBy: args.groupBy } : {}),
        }),
      );
    }),
  );

  if (options.enableActions) {
    const actionArgs = {
      actionType: z.string().min(1),
      parameters: z.record(z.string(), z.unknown()),
      ontology: ontologyArg,
    };
    const visibleAction = async (ontology: string | undefined, actionType: string) => {
      const m = await resolveOntology(ontology);
      return { m, action: m.actionTypes.find((a) => a.apiName === actionType) };
    };
    /** A refusal is an answer, not an error: return svc-actions' reasons verbatim. */
    const outcome = (r: Awaited<ReturnType<OntologyApi["applyAction"]>>) =>
      r.validation.result === "INVALID"
        ? {
            result: "REFUSED",
            reasons: (r.validation.submissionCriteria ?? []).map((c) => c.configuredFailureMessage).filter(Boolean),
            invalidParameters: Object.entries(r.validation.parameters ?? {}).filter(([, p]) => p.result === "INVALID").map(([k]) => k),
          }
        : r.proposal
          ? { result: "PROPOSED", proposal: r.proposal, note: "Nothing changed yet: a person must approve this proposal." }
          : { result: "APPLIED", edits: r.edits };

    server.registerTool(
      "validate_action",
      {
        description: "Check whether an action would be accepted with these parameters, without changing anything.",
        inputSchema: z.object(actionArgs),
      },
      guarded(async ({ actionType, parameters, ontology }: { actionType: string; parameters: Record<string, unknown>; ontology?: string }) => {
        const { m, action } = await visibleAction(ontology, actionType);
        if (!action) return fail(`No visible action type "${actionType}". Use list_actions.`);
        return ok(outcome(await api.applyAction(m.rid, actionType, parameters, { validateOnly: true })));
      }),
    );

    server.registerTool(
      "apply_action",
      {
        description:
          "Apply an action. Pass a fresh idempotencyKey per intended change and reuse it on retries, so a retry cannot apply twice. If the action requires approval the result is PROPOSED and nothing changes until a person approves.",
        inputSchema: z.object({ ...actionArgs, idempotencyKey: z.string().min(8).max(255) }),
      },
      guarded(async ({ actionType, parameters, ontology, idempotencyKey }: { actionType: string; parameters: Record<string, unknown>; ontology?: string; idempotencyKey: string }) => {
        const { m, action } = await visibleAction(ontology, actionType);
        if (!action) return fail(`No visible action type "${actionType}". Use list_actions.`);
        return ok(outcome(await api.applyAction(m.rid, actionType, parameters, { validateOnly: false, idempotencyKey })));
      }),
    );
  }

  return server;
}
