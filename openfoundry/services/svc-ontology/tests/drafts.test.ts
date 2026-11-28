/**
 * Cold-start drafting from datasets: a proposal by default, EXPERIMENTAL
 * dataset-backed types and data-confirmed links with `?apply=true`.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";
import type { DatasetReader } from "../src/routes/v2/drafts.js";

const rows = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i + 1)).join("\n");
const DATASETS: Record<string, { name: string; csvFiles: Array<{ path: string; text: string }> }> = {
  "ri.datasets.main.dataset.buyers": {
    name: "buyers",
    csvFiles: [{ path: "buyers.csv", text: `buyer_id,name\n${rows(10, (i) => `B${i},Buyer ${i}`)}` }],
  },
  "ri.datasets.main.dataset.invoices": {
    name: "invoices",
    csvFiles: [
      { path: "part-1.csv", text: `invoice_id,buyer_id,amount\n${rows(10, (i) => `INV-${i},B${i},${i * 10}.5`)}` },
      { path: "part-2.csv", text: `invoice_id,buyer_id,amount\n${rows(5, (i) => `INV-${100 + i},B${i},1.25`)}` },
    ],
  },
  "ri.datasets.main.dataset.empty": { name: "empty", csvFiles: [] },
};
const reader: DatasetReader = { read: async (rid) => DATASETS[rid] };

let app: FastifyInstance;
let base: string;
beforeEach(async () => {
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    store: new OntologyStore(null),
    datasets: reader,
  });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "ar", displayName: "AR", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}`;
});

const draft = (query = "") =>
  app.inject({
    method: "POST",
    url: `${base}/drafts/fromDatasets${query}`,
    payload: { datasets: Object.keys(DATASETS).map((datasetRid) => ({ datasetRid })) },
  });

describe("drafting from datasets", () => {
  it("proposes types and confirmed links without writing, across a dataset's files", async () => {
    const res = (await draft()).json();
    expect(res.applied).toBe(false);
    expect(res.objectTypes.map((t: { apiName: string }) => t.apiName)).toEqual(["Buyer", "Invoice"]);
    expect(res.linkTypes).toEqual([expect.objectContaining({ apiName: "invoiceBuyer", foreignKeyPropertyApiName: "buyerId" })]);
    expect(res.evidence.tables[1].sampledRows).toBe(15);
    expect(res.skipped).toEqual(["empty: the dataset has no CSV files"]);
    expect((await app.inject({ method: "GET", url: `${base}/objectTypes` })).json().data).toEqual([]);
  });

  it("creates EXPERIMENTAL dataset-backed types and links on apply", async () => {
    const res = (await draft("?apply=true")).json();
    expect(res.created).toEqual({ objectTypes: ["Buyer", "Invoice"], linkTypes: ["invoiceBuyer"] });
    const invoice = (await app.inject({ method: "GET", url: `${base}/objectTypes/Invoice?includeDatasources=true` })).json();
    expect(invoice.status).toBe("EXPERIMENTAL");
    expect(invoice.properties.amount.type).toBe("DOUBLE");
    expect(invoice.datasources[0].rid).toMatch(/datasource/);
    expect(invoice.datasources[0].definition.datasetRid).toBe("ri.datasets.main.dataset.invoices");

    const again = (await draft("?apply=true")).json();
    expect(again.created).toEqual({ objectTypes: [], linkTypes: [] });
  });

  it("refuses a request without datasets", async () => {
    const res = await app.inject({ method: "POST", url: `${base}/drafts/fromDatasets`, payload: {} });
    expect(res.statusCode).toBe(400);
  });
});
