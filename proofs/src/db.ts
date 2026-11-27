import pg from 'pg';

export const ADMIN_URL = process.env.PROOFS_ADMIN_URL ?? 'postgres://postgres@localhost:5433/postgres';

/** Create a fresh database for one test file and return a pool on it. */
export async function freshDb(name: string): Promise<{ pool: pg.Pool; url: string; drop: () => Promise<void> }> {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();
  const url = ADMIN_URL.replace(/\/[^/]*$/, `/${name}`);
  const pool = new pg.Pool({ connectionString: url, max: 20 });
  return {
    pool, url,
    drop: async () => {
      await pool.end();
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await a.end();
    },
  };
}

export async function tx<T>(client: pg.PoolClient, fn: () => Promise<T>, isolation = 'READ COMMITTED'): Promise<T> {
  await client.query(`BEGIN ISOLATION LEVEL ${isolation}`);
  try {
    const r = await fn();
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}
