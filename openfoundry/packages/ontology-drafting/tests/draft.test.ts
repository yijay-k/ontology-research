import { describe, it, expect } from "vitest";
import { draftOntology, inferType, parseCSV, profileTable, propertyName, typeName } from "../src/index.js";

const csv = (header: string, rows: string[]) => parseCSV([header, ...rows].join("\n"));
const range = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i + 1));
const pad = (i: number) => String(i).padStart(3, "0");

const buyers = csv("buyer_id,name,rating,postcode", range(20, (i) => `B${pad(i)},Buyer ${i},${"ABC"[i % 3]},0${1000 + i}`));
const invoices = csv(
  "invoice_id,buyer_id,amount,due_date,status,legacy_ref",
  range(40, (i) => `INV-${pad(i)},B${pad((i % 20) + 1)},${(i * 12.5).toFixed(2)},2026-${String((i % 12) + 1).padStart(2, "0")}-15,${["open", "paid", "disputed"][i % 3]},X${i % 2 === 0 ? pad(i) : "Z" + i}`),
);
const payments = csv(
  "payment_id,invoice_id,amount,paid_on,status_code",
  range(25, (i) => `${i},INV-${pad(i)},${(i * 12.5).toFixed(2)},2026-06-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z,${(i % 3) + 1}`),
);
const events = csv("source,kind", range(10, (i) => `erp,${i % 2 ? "sync" : "load"}`));

const draft = () =>
  draftOntology([
    { datasetRid: "ri.datasets.main.dataset.buyers", profile: profileTable("buyers.csv", buyers) },
    { datasetRid: "ri.datasets.main.dataset.invoices", profile: profileTable("invoices.csv", invoices) },
    { datasetRid: "ri.datasets.main.dataset.payments", profile: profileTable("payments.csv", payments) },
    { datasetRid: "ri.datasets.main.dataset.events", profile: profileTable("events.csv", events) },
  ]);

describe("profiling", () => {
  it("infers types, keeping leading-zero identifiers as strings", () => {
    expect(inferType(["1", "2"])).toBe("INTEGER");
    expect(inferType(["01001", "01002"])).toBe("STRING");
    expect(inferType(["12.50", "3"])).toBe("DOUBLE");
    expect(inferType(["2026-01-15"])).toBe("DATE");
    expect(inferType(["2026-06-02T10:00:00Z"])).toBe("TIMESTAMP");
    expect(inferType(["true", "FALSE"])).toBe("BOOLEAN");
    expect(inferType(["2026-13-45"])).toBe("STRING");
  });

  it("picks an identifier-named unique column as the key, and lists low-cardinality values", () => {
    const p = profileTable("invoices.csv", invoices);
    expect(p.primaryKey).toBe("invoice_id");
    const status = p.columns.find((c) => c.column === "status")!;
    expect(status.values).toEqual(["disputed", "open", "paid"]);
    expect(status.keyCandidate).toBe(false);
  });

  it("names types and properties", () => {
    expect(typeName("customer_orders.csv")).toBe("CustomerOrder");
    expect(typeName("companies")).toBe("Company");
    expect(propertyName("due_date")).toBe("dueDate");
  });
});

describe("drafting", () => {
  it("drafts a dataset-backed EXPERIMENTAL type per keyed table", () => {
    const d = draft();
    expect(d.objectTypes.map((t) => t.apiName)).toEqual(["Buyer", "Invoice", "Payment"]);
    const invoice = d.objectTypes[1] as {
      status: string; primaryKeyApiName: string; properties: Record<string, { type: string }>;
      datasources: Array<{ definition: { datasetRid: string; propertyMapping: Record<string, unknown> } }>;
    };
    expect(invoice.status).toBe("EXPERIMENTAL");
    expect(invoice.primaryKeyApiName).toBe("invoiceId");
    expect(invoice.properties.amount.type).toBe("DOUBLE");
    expect(invoice.properties.dueDate.type).toBe("DATE");
    expect(invoice.datasources[0].definition).toMatchObject({
      datasetRid: "ri.datasets.main.dataset.invoices",
      propertyMapping: { dueDate: { type: "column", column: "due_date" } },
    });
    expect(d.skipped).toEqual([expect.stringMatching(/events.csv: no column is unique/)]);
  });

  it("proposes only links the data confirms", () => {
    const d = draft();
    expect(d.linkTypes).toEqual([
      { apiName: "invoiceBuyer", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Buyer", cardinality: "ONE", foreignKeyPropertyApiName: "buyerId" },
      { apiName: "paymentInvoice", objectTypeApiName: "Payment", linkedObjectTypeApiName: "Invoice", cardinality: "ONE", foreignKeyPropertyApiName: "invoiceId" },
    ]);
    expect(d.evidence.links[0]).toMatchObject({ from: "Invoice", column: "buyer_id", to: "Buyer", containment: 1, nameAffinity: true });
    // status_code 1-3 lies inside Payment's integer keys but is not a link;
    // legacy_ref partly resembles invoice ids but is not contained in them.
    expect(d.evidence.links.map((l) => l.column)).toEqual(["buyer_id", "invoice_id"]);
  });

  it("keeps sampled value sets out of the evidence it returns", () => {
    const cols = draft().evidence.tables[0].columns[0] as Record<string, unknown>;
    expect(cols).not.toHaveProperty("valueSet");
    expect(JSON.stringify(draft())).toBeTypeOf("string");
  });
});
