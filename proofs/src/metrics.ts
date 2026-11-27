/**
 * Join-safety check copied from MetricFlow
 * (metricflow_semantics/model/semantics/semantic_model_join_evaluator.py @013590e):
 * MAX_JOIN_HOPS = 2 and the valid entity-type pairs that cannot fan out.
 */
export type EntityType = 'primary' | 'unique' | 'foreign' | 'natural';
export const MAX_JOIN_HOPS = 2;
const VALID: ReadonlyArray<[EntityType, EntityType]> = [
  ['primary', 'natural'], ['primary', 'primary'], ['primary', 'unique'],
  ['unique', 'natural'], ['unique', 'primary'], ['unique', 'unique'],
  ['foreign', 'natural'], ['foreign', 'primary'], ['foreign', 'unique'],
  ['natural', 'primary'], ['natural', 'unique'],
];
export const isValidJoin = (l: EntityType, r: EntityType) => VALID.some(([a, b]) => a === l && b === r);

export type SemanticModel = { name: string; table: string; entities: Record<string, EntityType>; measures: Record<string, string> };

/** Validate a join path model[0] → model[1] → … on the given entity at each hop. Returns a reason when unsafe. */
export function checkPath(models: SemanticModel[], onEntities: string[]): string | null {
  if (models.length - 1 > MAX_JOIN_HOPS) return `path has ${models.length - 1} hops; max is ${MAX_JOIN_HOPS}`;
  for (let i = 0; i < models.length - 1; i++) {
    const e = onEntities[i];
    const l = models[i].entities[e], r = models[i + 1].entities[e];
    if (!l || !r) return `entity ${e} missing on ${models[i].name} or ${models[i + 1].name}`;
    if (!isValidJoin(l, r)) return `${models[i].name}.${e} (${l}) → ${models[i + 1].name}.${e} (${r}) can fan out`;
  }
  return null;
}
