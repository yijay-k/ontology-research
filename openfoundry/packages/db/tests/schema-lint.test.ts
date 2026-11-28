/**
 * Schema lint over both schema sources (`db/migrations/`, `scripts/migrate.sql`).
 *
 * A view owned by a privileged role reads its tables with the owner's rights,
 * so row-level security on those tables does not apply to anyone querying the
 * view - unless the view is created `WITH (security_invoker = true)`. The
 * research's executable proof T5 (ontology-research, proofs/tests/
 * tenant-isolation.test.ts) reproduced this silent bypass on Postgres 16.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function schemaFiles(): string[] {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return [
    ...readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f)),
    path.join(REPO_ROOT, "scripts/migrate.sql"),
  ];
}

/** Every `CREATE [OR REPLACE] VIEW` statement that does not opt into security_invoker. */
export function viewsWithoutSecurityInvoker(sql: string): string[] {
  const statements = sql.replace(/--.*$/gm, "").split(";");
  return statements
    .filter((s) => /\bcreate\s+(or\s+replace\s+)?(temp(orary)?\s+)?view\b/i.test(s))
    .filter((s) => !/security_invoker\s*=\s*(true|on|1)/i.test(s))
    .map((s) => s.trim().split("\n")[0]);
}

describe("schema lint", () => {
  it("flags a view without security_invoker and accepts one with it", () => {
    expect(viewsWithoutSecurityInvoker("CREATE VIEW v AS SELECT 1;")).toHaveLength(1);
    expect(viewsWithoutSecurityInvoker("CREATE OR REPLACE VIEW v WITH (security_invoker = true) AS SELECT 1;")).toEqual([]);
    expect(viewsWithoutSecurityInvoker("-- CREATE VIEW v AS SELECT 1;\nSELECT 1;")).toEqual([]);
  });

  it.each(schemaFiles().map((f) => [path.relative(REPO_ROOT, f), f]))(
    "%s creates every view with security_invoker = true",
    (_name, file) => {
      expect(viewsWithoutSecurityInvoker(readFileSync(file, "utf8"))).toEqual([]);
    },
  );
});
