/**
 * Does the ontology cover a question? Checked before an agent answers, so it
 * can refuse or ask instead of guessing (the research's "typed refusal for
 * out-of-scope questions"; NVIDIA Auto Ontology's `check_answerable`).
 *
 * ponytail: lexical matching of question terms against type, property and
 * action names. It cannot see synonyms the model does not name ("debtor" for
 * Buyer); add `ai_context.synonyms` from an Ossie import, or an embedding
 * match, when coverage misses real questions.
 */
import type { ActionTypeShape, ObjectTypeShape } from "./api.js";

const STOPWORDS = new Set(
  ("a about above after again all am an and any are as at be because been before being below between both but by " +
    "can could did do does doing down during each few for from further had has have having he her here hers how i if " +
    "in into is it its itself just me more most my no nor not now of off on once only or other our out over own same " +
    "she should so some such than that the their them then there these they this those through to too under until up " +
    "very was we were what when where which while who whom why will with would you your show list give tell find get " +
    "many much whats which ones last first next per").split(" "),
);

/** Lowercase words of three letters or more, singular, from free text or an apiName. */
export function terms(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .map((w) => (w.length > 4 && w.endsWith("ies") ? w.slice(0, -3) + "y" : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

export interface Answerability {
  verdict: "answerable" | "partial" | "not_answerable";
  /** Share of the question's content terms the ontology names, 0-1. */
  coverage: number;
  covered: Array<{ term: string; matches: string[] }>;
  uncovered: string[];
  /** Object types the question most likely concerns, best first. */
  objectTypes: string[];
  actionTypes: string[];
}

export function checkAnswerable(
  question: string,
  objectTypes: ObjectTypeShape[],
  actionTypes: ActionTypeShape[],
): Answerability {
  const vocabulary = new Map<string, Set<string>>();
  const add = (word: string, where: string) => {
    for (const t of terms(word)) {
      if (!vocabulary.has(t)) vocabulary.set(t, new Set());
      vocabulary.get(t)!.add(where);
    }
  };
  for (const ot of objectTypes) {
    add(ot.apiName, ot.apiName);
    if (ot.displayName) add(ot.displayName, ot.apiName);
    for (const property of Object.keys(ot.properties ?? {})) add(property, `${ot.apiName}.${property}`);
  }
  for (const at of actionTypes) add(at.apiName, `action:${at.apiName}`);

  const questionTerms = [...new Set(terms(question))];
  const covered: Answerability["covered"] = [];
  const uncovered: string[] = [];
  const typeHits = new Map<string, number>();
  const actionHits = new Map<string, number>();
  for (const term of questionTerms) {
    const matches = vocabulary.get(term);
    if (!matches) {
      uncovered.push(term);
      continue;
    }
    covered.push({ term, matches: [...matches].sort() });
    for (const m of matches) {
      if (m.startsWith("action:")) actionHits.set(m.slice(7), (actionHits.get(m.slice(7)) ?? 0) + 1);
      else {
        const type = m.split(".")[0];
        typeHits.set(type, (typeHits.get(type) ?? 0) + 1);
      }
    }
  }

  const coverage = questionTerms.length === 0 ? 0 : covered.length / questionTerms.length;
  const ranked = (hits: Map<string, number>) => [...hits].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
  const verdict =
    typeHits.size === 0 ? "not_answerable" : coverage >= 0.6 ? "answerable" : coverage >= 0.3 ? "partial" : "not_answerable";
  return {
    verdict,
    coverage: Math.round(coverage * 100) / 100,
    covered,
    uncovered,
    objectTypes: ranked(typeHits),
    actionTypes: ranked(actionHits),
  };
}
