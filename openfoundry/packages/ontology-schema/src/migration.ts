/**
 * Schema migrations: how existing objects follow a breaking change to their
 * type, after Palantir's schema-migration model
 * (https://www.palantir.com/docs/foundry/object-edits/schema-migrations/):
 * a removed property's values and edits are dropped or moved, a retyped
 * property's values are cast. A primary-key change has no migration here.
 */

export type MigrationStep =
  | { type: "dropProperty"; property: string }
  | { type: "renameProperty"; from: string; to: string }
  | { type: "castProperty"; property: string; to: string };

interface PropertyLike {
  type?: unknown;
}

/** Parse and check a list of steps from a request body. */
export function parseMigrationSteps(value: unknown): MigrationStep[] {
  if (!Array.isArray(value)) throw new Error("migrations must be an array");
  return value.map((s, i) => {
    const step = s as Record<string, unknown>;
    const str = (k: string) => {
      if (typeof step?.[k] !== "string" || step[k] === "") throw new Error(`migrations[${i}].${k} must be a non-empty string`);
      return step[k] as string;
    };
    switch (step?.type) {
      case "dropProperty":
        return { type: "dropProperty", property: str("property") };
      case "renameProperty":
        return { type: "renameProperty", from: str("from"), to: str("to") };
      case "castProperty":
        return { type: "castProperty", property: str("property"), to: str("to").toUpperCase() };
      default:
        throw new Error(`migrations[${i}].type must be dropProperty, renameProperty or castProperty`);
    }
  });
}

/**
 * The breaking changes from `before` to `after` properties that `steps` do not
 * account for: a removed property needs a drop or a rename to a property that
 * exists after; a retyped property needs a cast to its new type.
 */
export function uncoveredBreaks(
  before: Record<string, PropertyLike>,
  after: Record<string, PropertyLike>,
  steps: MigrationStep[],
): string[] {
  const uncovered: string[] = [];
  const type = (p: PropertyLike | undefined) => String(p?.type ?? "").toUpperCase();
  for (const [name, property] of Object.entries(before)) {
    if (!Object.hasOwn(after, name)) {
      const handled = steps.some(
        (s) =>
          (s.type === "dropProperty" && s.property === name) ||
          (s.type === "renameProperty" && s.from === name && Object.hasOwn(after, s.to)),
      );
      if (!handled) uncovered.push(`property "${name}" is removed without a dropProperty or renameProperty`);
    } else if (type(property) !== type(after[name])) {
      const handled = steps.some((s) => s.type === "castProperty" && s.property === name && s.to === type(after[name]));
      if (!handled) uncovered.push(`property "${name}" changes type to ${type(after[name])} without a castProperty`);
    }
  }
  return uncovered;
}

/** One value as `to`, or an error saying why it cannot be. */
export function castValue(value: unknown, to: string): { value?: unknown; error?: string } {
  if (value === null || value === undefined) return { value };
  const text = typeof value === "string" ? value.trim() : value;
  switch (to.toUpperCase()) {
    case "STRING":
      return { value: typeof value === "string" ? value : JSON.stringify(value) };
    case "INTEGER":
    case "LONG":
    case "SHORT":
    case "BYTE": {
      const n = typeof text === "number" ? text : Number(text);
      return Number.isInteger(n) && text !== "" ? { value: n } : { error: `${JSON.stringify(value)} is not an integer` };
    }
    case "DOUBLE":
    case "FLOAT":
    case "DECIMAL": {
      const n = typeof text === "number" ? text : Number(text);
      return Number.isFinite(n) && text !== "" ? { value: n } : { error: `${JSON.stringify(value)} is not a number` };
    }
    case "BOOLEAN":
      if (typeof value === "boolean") return { value };
      if (typeof text === "string" && /^(true|false)$/i.test(text)) return { value: text.toLowerCase() === "true" };
      return { error: `${JSON.stringify(value)} is not a boolean` };
    case "DATE":
    case "TIMESTAMP":
      return typeof text === "string" && !Number.isNaN(Date.parse(text))
        ? { value: text }
        : { error: `${JSON.stringify(value)} is not a date` };
    default:
      return { error: `cannot cast to ${to}` };
  }
}

/**
 * One object's properties (or one edit patch) after the steps. Throws on the
 * first value that cannot be cast, so a migration applies to every object or
 * to none.
 */
export function migrateProperties(properties: Record<string, unknown>, steps: MigrationStep[]): Record<string, unknown> {
  const next = { ...properties };
  for (const step of steps) {
    if (step.type === "dropProperty") {
      delete next[step.property];
    } else if (step.type === "renameProperty") {
      if (Object.hasOwn(next, step.from)) {
        next[step.to] = next[step.from];
        delete next[step.from];
      }
    } else if (Object.hasOwn(next, step.property)) {
      const cast = castValue(next[step.property], step.to);
      if (cast.error) throw new Error(`${step.property}: ${cast.error}`);
      next[step.property] = cast.value;
    }
  }
  return next;
}
