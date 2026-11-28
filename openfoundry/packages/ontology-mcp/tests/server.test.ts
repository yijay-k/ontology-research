/**
 * The read-only ontology MCP server, driven through a real MCP client over an
 * in-memory transport against a fake receivables API.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { createOntologyMcpServer } from "../src/server.js";
import type { LoadObjectsRequest, OntologyApi, OntologyMetadata } from "../src/api.js";

const METADATA: OntologyMetadata = {
  rid: "ri.ontology.main.ontology.ar",
  apiName: "receivables",
  objectTypes: [
    {
      apiName: "Invoice",
      displayName: "Invoice",
      description: "A receivable",
      agentDescription: "One receivable owed by a buyer; amount is in the invoice currency.",
      metrics: { openAmount: { measure: { type: "sum", property: "amount" }, timeProperty: "dueDate", unit: "EUR" } },
      status: "ACTIVE",
      primaryKeyApiName: "invoiceId",
      properties: {
        invoiceId: { type: "string" },
        amount: { type: "double", editable: false },
        dueDate: { type: "date" },
        status: { type: "string" },
        buyerId: { type: "string" },
      },
    },
    {
      apiName: "Buyer",
      displayName: "Buyer",
      description: "A debtor",
      status: "ACTIVE",
      primaryKeyApiName: "buyerId",
      properties: { buyerId: { type: "string" }, name: { type: "string" }, rating: { type: "string" } },
    },
    { apiName: "DraftScore", description: "Experimental scoring", status: "EXPERIMENTAL", properties: { score: { type: "double" } } },
  ],
  actionTypes: [
    {
      apiName: "send-reminder",
      description: "Email a payment reminder",
      status: "ACTIVE",
      parameters: { invoiceId: { type: "string", required: true } },
      modifiedEntities: { Invoice: { created: false, modified: true } },
    },
  ],
  linkTypes: [{ apiName: "owedBy", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Buyer", cardinality: "ONE" }],
};

let requests: LoadObjectsRequest[];
let applied: Array<{ actionType: string; parameters: Record<string, unknown>; validateOnly: boolean; idempotencyKey?: string }>;
const api: OntologyApi = {
  queryMetric: async (_rid, query) => ({ ...query, rows: [{ value: 42 }] }),
  applyAction: async (_rid, actionType, parameters, options) => {
    applied.push({ actionType, parameters, ...options });
    if (parameters.days === 0) {
      return { validation: { result: "INVALID", submissionCriteria: [{ configuredFailureMessage: "days must be positive", result: "INVALID" }], parameters: { days: { result: "INVALID" } } } };
    }
    if (actionType === "write-off") return { validation: { result: "VALID" }, proposal: { rid: "ri.actions.proposal.1", status: "PENDING" } };
    return { validation: { result: "VALID" }, edits: { modifiedObjectsCount: 1 } };
  },
  listOntologies: async () => [{ rid: METADATA.rid, apiName: METADATA.apiName }],
  metadata: async () => METADATA,
  loadObjects: async (_rid, request) => {
    requests.push(request);
    return { data: [{ primaryKey: "INV-1", properties: { amount: 1200 } }], totalCount: 1 };
  },
};

async function connect(includeExperimental = false, enableActions = false) {
  const server = createOntologyMcpServer({ api, includeExperimental, enableActions });
  const [clientEnd, serverEnd] = InMemoryTransport.createLinkedPair();
  await server.connect(serverEnd);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientEnd);
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = (await client.callTool({ name, arguments: args })) as { content: Array<{ text: string }>; isError?: boolean };
  const text = result.content[0].text;
  return { isError: result.isError === true, text, json: () => JSON.parse(text) };
}

let client: Client;
beforeEach(async () => {
  requests = [];
  applied = [];
  client = await connect();
});

describe("ontology MCP server", () => {
  it("offers only read tools unless actions are enabled", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["check_answerable", "check_readiness", "get_type", "list_actions", "query_metric", "query_objects", "search_types"],
    );
    const withActions = (await (await connect(false, true)).listTools()).tools.map((t) => t.name);
    expect(withActions).toEqual(expect.arrayContaining(["validate_action", "apply_action"]));
  });

  it("reports readiness counting only ACTIVE definitions", async () => {
    const res = (await call(client, "check_readiness")).json();
    expect(res.ready).toBe(true);
    expect(res.ontologies[0]).toMatchObject({ apiName: "receivables", objectTypes: 2, actionTypes: 1, hiddenObjectTypes: 1 });
  });

  it("finds types by name and property words, preferring agentDescription", async () => {
    const res = (await call(client, "search_types", { query: "invoice amount due" })).json();
    expect(res.results[0]).toMatchObject({ apiName: "Invoice", description: METADATA.objectTypes[0].agentDescription });
  });

  it("describes a type with editability, links and the actions that change it", async () => {
    const res = (await call(client, "get_type", { objectType: "Invoice" })).json();
    expect(res.primaryKey).toBe("invoiceId");
    expect(res.properties.amount).toEqual({ type: "double", editable: false });
    expect(res.properties.status).toEqual({ type: "string" });
    expect(res.links).toEqual([{ link: "owedBy", to: "Buyer", cardinality: "ONE" }]);
    expect(res.actions).toEqual([{ apiName: "send-reminder", creates: false, modifies: true }]);
  });

  it("hides EXPERIMENTAL types unless configured to include them", async () => {
    expect((await call(client, "get_type", { objectType: "DraftScore" })).isError).toBe(true);
    const permissive = await connect(true);
    expect((await call(permissive, "get_type", { objectType: "DraftScore" })).isError).toBe(false);
  });

  it("judges a covered question answerable and names the types it concerns", async () => {
    const res = (await call(client, "check_answerable", { question: "Which invoices are past their due date, by buyer rating?" })).json();
    expect(res.verdict).toBe("answerable");
    expect(res.objectTypes[0]).toBe("Invoice");
    expect(res.objectTypes).toContain("Buyer");
  });

  it("judges a question about data the ontology lacks not answerable and names what is missing", async () => {
    const res = (await call(client, "check_answerable", { question: "What was return on ad spend for campaigns in June?" })).json();
    expect(res.verdict).toBe("not_answerable");
    expect(res.uncovered).toEqual(expect.arrayContaining(["spend", "campaign"]));
  });

  it("queries with a required select, a filter and a bounded page", async () => {
    const res = await call(client, "query_objects", {
      objectType: "Invoice",
      select: ["amount", "dueDate"],
      where: { type: "gt", field: "amount", value: 1000 },
      pageSize: 10,
    });
    expect(res.json().rows).toEqual([{ primaryKey: "INV-1", amount: 1200 }]);
    expect(requests[0]).toEqual({
      objectSet: { type: "filter", objectSet: { type: "base", objectType: "Invoice" }, where: { type: "gt", field: "amount", value: 1000 } },
      select: ["amount", "dueDate"],
      pageSize: 10,
    });
  });

  it("refuses a query without select, with unknown properties, or with an oversized page", async () => {
    expect((await call(client, "query_objects", { objectType: "Invoice", select: [] })).isError).toBe(true);
    expect((await call(client, "query_objects", { objectType: "Invoice", select: ["ghost"] })).text).toMatch(/no properties ghost/);
    expect((await call(client, "query_objects", { objectType: "Invoice", select: ["amount"], pageSize: 500 })).isError).toBe(true);
    expect(requests).toEqual([]);
  });

  it("lists a type's metrics and queries one", async () => {
    expect((await call(client, "get_type", { objectType: "Invoice" })).json().metrics).toEqual([
      { name: "openAmount", measure: { type: "sum", property: "amount" }, timeProperty: "dueDate", unit: "EUR" },
    ]);
    const res = (await call(client, "query_metric", { objectType: "Invoice", metric: "openAmount", grain: "month" })).json();
    expect(res).toMatchObject({ metric: "openAmount", grain: "month", rows: [{ value: 42 }] });
  });

  describe("with actions enabled", () => {
    let writer: Client;
    beforeEach(async () => {
      writer = await connect(false, true);
    });

    it("applies with the caller's idempotency key and reports the edits", async () => {
      const res = (await call(writer, "apply_action", { actionType: "send-reminder", parameters: { invoiceId: "INV-1" }, idempotencyKey: "reminder-INV-1-0001" })).json();
      expect(res).toEqual({ result: "APPLIED", edits: { modifiedObjectsCount: 1 } });
      expect(applied[0]).toMatchObject({ validateOnly: false, idempotencyKey: "reminder-INV-1-0001" });
    });

    it("returns a refusal's reasons verbatim, as an answer", async () => {
      const res = await call(writer, "validate_action", { actionType: "send-reminder", parameters: { days: 0 } });
      expect(res.isError).toBe(false);
      expect(res.json()).toEqual({ result: "REFUSED", reasons: ["days must be positive"], invalidParameters: ["days"] });
      expect(applied[0].validateOnly).toBe(true);
    });

    it("reports an action that needs approval as proposed, not applied", async () => {
      METADATA.actionTypes.push({ apiName: "write-off", status: "ACTIVE", modifiedEntities: { Invoice: { modified: true } } });
      try {
        const res = (await call(writer, "apply_action", { actionType: "write-off", parameters: {}, idempotencyKey: "write-off-0001" })).json();
        expect(res).toMatchObject({ result: "PROPOSED", proposal: { status: "PENDING" } });
      } finally {
        METADATA.actionTypes.pop();
      }
    });

    it("refuses an action that is not visible, and requires an idempotency key", async () => {
      expect((await call(writer, "apply_action", { actionType: "ghost", parameters: {}, idempotencyKey: "ghost-00001" })).isError).toBe(true);
      expect((await call(writer, "apply_action", { actionType: "send-reminder", parameters: {} })).isError).toBe(true);
      expect(applied).toEqual([]);
    });
  });
});

