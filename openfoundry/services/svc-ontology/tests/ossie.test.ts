/**
 * Apache Ossie export and import (`/api/v2/ontologies/:rid/ossie`): an Ossie
 * model drafted elsewhere (NVIDIA Auto Ontology, dbt) seeds EXPERIMENTAL
 * object and link types here, and our model exports back to the same shape.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import yaml from "js-yaml";
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";

const MODEL_YAML = `
version: "0.3.0.dev0"
name: receivables
datasets:
  - name: Buyer
    source: erp.public.customers
    primary_key: [buyerId]
    description: A debtor
    ai_context:
      synonyms: [debtor, obligor]
    fields:
      - name: buyerId
        expression: { sql: customer_id }
        datatype: String
      - name: rating
        expression: { sql: credit_rating }
        datatype: String
  - name: Invoice
    source: erp.public.invoices
    primary_key: [invoiceId]
    ai_context:
      instructions: One receivable; amount is in the invoice currency.
    fields:
      - name: invoiceId
        expression: { sql: invoice_id }
        datatype: String
      - name: buyerId
        expression: { sql: customer_id }
        datatype: String
      - name: amount
        expression: { sql: amount }
        datatype: Decimal
        nonportable_extensions:
          - vendor_name: OPENFOUNDRY
            data: { editable: false }
      - name: dueDate
        expression: { sql: due_date }
        datatype: Date
    metrics:
      - name: total_open
        expression: { sql: "SUM(amount)" }
  - name: OrderLine
    source: erp.public.order_lines
    primary_key: [orderId, lineNo]
    fields:
      - name: orderId
        expression: { sql: order_id }
      - name: lineNo
        expression: { sql: line_no }
relationships:
  - name: owedBy
    from: Invoice
    to: Buyer
    from_columns: [buyerId]
    to_columns: [buyerId]
`;

let app: FastifyInstance;
let base: string;

beforeEach(async () => {
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    store: new OntologyStore(null),
  });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "ar", displayName: "AR", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}`;
});

const importYaml = (body: string, query = "") =>
  app.inject({ method: "POST", url: `${base}/ossie${query}`, headers: { "content-type": "application/yaml" }, payload: body });

describe("Ossie import", () => {
  it("plans without writing on a dry run, and reports what it cannot express", async () => {
    const res = await importYaml(MODEL_YAML, "?dryRun=true");
    expect(res.statusCode).toBe(200);
    const plan = res.json();
    expect(plan.objectTypes.map((t: { apiName: string }) => t.apiName)).toEqual(["Buyer", "Invoice"]);
    expect(plan.linkTypes).toEqual([
      expect.objectContaining({ apiName: "owedBy", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Buyer", foreignKeyPropertyApiName: "buyerId" }),
    ]);
    expect(plan.skipped).toEqual(expect.arrayContaining([
      expect.stringMatching(/OrderLine: needs exactly one primary key/),
      expect.stringMatching(/metric total_open/),
    ]));
    const types = await app.inject({ method: "GET", url: `${base}/objectTypes` });
    expect(types.json().data).toEqual([]);
  });

  it("creates EXPERIMENTAL drafts with types, editability and agent context", async () => {
    const res = await importYaml(MODEL_YAML);
    expect(res.json().created).toEqual({ objectTypes: ["Buyer", "Invoice"], linkTypes: ["owedBy"] });

    const invoice = (await app.inject({ method: "GET", url: `${base}/objectTypes/Invoice` })).json();
    expect(invoice.status).toBe("EXPERIMENTAL");
    expect(invoice.primaryKeyApiName).toBe("invoiceId");
    expect(invoice.properties.amount).toMatchObject({ type: "DECIMAL", editable: false });
    expect(invoice.properties.dueDate.type).toBe("DATE");
    expect(invoice.agentDescription).toBe("One receivable; amount is in the invoice currency.");
    const buyer = (await app.inject({ method: "GET", url: `${base}/objectTypes/Buyer` })).json();
    expect(buyer.agentDescription).toBe("Also called: debtor, obligor.");
  });

  it("leaves an existing type unchanged and says so", async () => {
    await importYaml(MODEL_YAML);
    const again = (await importYaml(MODEL_YAML)).json();
    expect(again.created).toEqual({ objectTypes: [], linkTypes: [] });
    expect(again.skipped).toEqual(expect.arrayContaining([expect.stringMatching(/Invoice: an object type of that name exists/)]));
  });

  it("refuses a body that is not an Ossie model", async () => {
    expect((await importYaml("hello: world")).statusCode).toBe(400);
    expect((await importYaml(": not yaml: [")).statusCode).toBe(400);
  });
});

describe("Ossie export", () => {
  it("round-trips an imported model's datasets and relationships", async () => {
    await importYaml(MODEL_YAML);
    const res = await app.inject({ method: "GET", url: `${base}/ossie?format=yaml` });
    expect(res.headers["content-type"]).toMatch(/yaml/);
    const model = yaml.load(res.body) as {
      version: string;
      datasets: Array<{ name: string; primary_key: string[]; fields: Array<{ name: string; datatype?: string; nonportable_extensions?: unknown }> }>;
      relationships: unknown[];
    };
    expect(model.version).toBe("0.3.0.dev0");
    const invoice = model.datasets.find((d) => d.name === "Invoice")!;
    expect(invoice.primary_key).toEqual(["invoiceId"]);
    expect(invoice.fields.find((f) => f.name === "amount")).toMatchObject({
      datatype: "Decimal",
      nonportable_extensions: [{ vendor_name: "OPENFOUNDRY", data: { editable: false } }],
    });
    expect(model.relationships).toEqual([
      { name: "owedBy", from: "Invoice", to: "Buyer", from_columns: ["buyerId"], to_columns: ["buyerId"] },
    ]);

    // Re-importing the export into a fresh ontology plans the same definitions.
    const fresh = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "ar2", displayName: "AR2", description: "" } });
    const replan = await app.inject({
      method: "POST",
      url: `/api/v2/ontologies/${fresh.json().rid}/ossie?dryRun=true`,
      headers: { "content-type": "application/yaml" },
      payload: res.body,
    });
    expect(replan.json().objectTypes.map((t: { apiName: string }) => t.apiName).sort()).toEqual(["Buyer", "Invoice"]);
    expect(replan.json().skipped).toEqual([]);
  });
});
