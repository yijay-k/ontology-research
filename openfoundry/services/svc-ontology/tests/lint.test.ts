import { describe, it, expect } from "vitest";
import type { ActionTypeDefinition, LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { lintOntology } from "../src/lint.js";

const type = (apiName: string, extra: Record<string, unknown> = {}) =>
  ({ apiName, description: "", properties: { id: { type: "STRING" } }, status: "EXPERIMENTAL", ...extra }) as unknown as ObjectTypeDefinition;
const action = (apiName: string, entity: string, status = "ACTIVE") =>
  ({ apiName, description: "", parameters: {}, status, modifiedEntities: { [entity]: { created: false, modified: true } } }) as unknown as ActionTypeDefinition;

describe("modelling lint", () => {
  it("flags action sprawl, undescribed ACTIVE types, bad links and actions agents cannot use", () => {
    const types = [
      type("Invoice", { status: "ACTIVE" }),
      type("Buyer", { status: "ACTIVE", agentDescription: "A debtor" }),
      type("Draft"),
    ];
    const actions = [
      ...Array.from({ length: 11 }, (_, i) => action(`touch-${i}`, "Buyer")),
      action("score", "Draft"),
      action("ghost", "Nothing"),
    ];
    const links = [
      { apiName: "owedBy", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Buyer", cardinality: "ONE", foreignKeyPropertyApiName: "buyerId" },
      { apiName: "lost", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Gone", cardinality: "ONE", foreignKeyPropertyApiName: "id" },
    ] as LinkTypeDefinition[];
    const rules = lintOntology(types, actions, links).map((w) => `${w.rule}:${w.subject}`);
    expect(rules).toEqual([
      "undescribed-active-type:Invoice",
      "too-many-actions:Buyer",
      "undeclared-foreign-key:owedBy",
      "dangling-link:lost",
      "active-action-on-experimental-type:score",
      "undeclared-modified-entity:ghost",
    ]);
  });

  it("is quiet for a clean model", () => {
    expect(lintOntology([type("Invoice", { status: "ACTIVE", description: "A receivable" })], [], [])).toEqual([]);
  });
});
