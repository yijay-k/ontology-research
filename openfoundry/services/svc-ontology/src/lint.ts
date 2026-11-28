/**
 * Modelling lint: definition-level warnings a person should look at before
 * promoting an ontology for agents (research §4 L3; Palantir's guidance on
 * action sprawl). Warnings only - nothing is refused.
 *
 * ponytail: definitions only. "Mostly-null property" needs object data and
 * belongs beside the objects; add it once real datasets are loaded.
 */
import type { ActionTypeDefinition, LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";

export interface LintWarning {
  rule: string;
  subject: string;
  message: string;
}

const MAX_ACTIONS_PER_TYPE = 10;

export function lintOntology(
  objectTypes: ObjectTypeDefinition[],
  actionTypes: ActionTypeDefinition[],
  linkTypes: LinkTypeDefinition[],
): LintWarning[] {
  const warnings: LintWarning[] = [];
  const types = new Map(objectTypes.map((t) => [t.apiName, t]));
  const status = (s?: string) => String(s ?? "EXPERIMENTAL").toUpperCase();

  for (const t of objectTypes) {
    const actions = actionTypes.filter((a) => a.modifiedEntities?.[t.apiName]);
    if (actions.length > MAX_ACTIONS_PER_TYPE) {
      warnings.push({
        rule: "too-many-actions",
        subject: t.apiName,
        message: `${actions.length} action types modify ${t.apiName}; more than ${MAX_ACTIONS_PER_TYPE} usually means overlapping actions an agent cannot choose between`,
      });
    }
    if (status(t.status) === "ACTIVE" && !t.description?.trim() && !t.agentDescription?.trim()) {
      warnings.push({ rule: "undescribed-active-type", subject: t.apiName, message: `${t.apiName} is ACTIVE with no description or agentDescription; agents see only its name` });
    }
  }

  for (const l of linkTypes) {
    const source = types.get(l.objectTypeApiName);
    if (!source || !types.has(l.linkedObjectTypeApiName)) {
      warnings.push({ rule: "dangling-link", subject: l.apiName, message: `${l.apiName} links types that are not both declared` });
    } else if (l.foreignKeyPropertyApiName && !Object.hasOwn(source.properties ?? {}, l.foreignKeyPropertyApiName)) {
      warnings.push({
        rule: "undeclared-foreign-key",
        subject: l.apiName,
        message: `${l.apiName}'s foreign key ${l.foreignKeyPropertyApiName} is not a property of ${l.objectTypeApiName}`,
      });
    }
  }

  for (const a of actionTypes) {
    for (const entity of Object.keys(a.modifiedEntities ?? {})) {
      const t = types.get(entity);
      if (!t) {
        warnings.push({ rule: "undeclared-modified-entity", subject: a.apiName, message: `${a.apiName} modifies ${entity}, which is not declared` });
      } else if (status(a.status) === "ACTIVE" && status(t.status) === "EXPERIMENTAL") {
        warnings.push({
          rule: "active-action-on-experimental-type",
          subject: a.apiName,
          message: `${a.apiName} is ACTIVE but edits ${entity}, which is EXPERIMENTAL and hidden from agents`,
        });
      }
    }
  }
  return warnings;
}
