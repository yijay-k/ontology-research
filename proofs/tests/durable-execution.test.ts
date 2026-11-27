import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { freshDb } from '../src/db.ts';

let app: Awaited<ReturnType<typeof freshDb>>, sys: Awaited<ReturnType<typeof freshDb>>;
before(async () => {
  app = await freshDb('proof_dbos_app'); sys = await freshDb('proof_dbos_sys');
  await app.pool.query(`CREATE TABLE side_effects (wf text, step text, at timestamptz DEFAULT now())`);
});
after(async () => { await app.drop(); await sys.drop(); });

const run = (mode: string) => spawnSync(process.execPath, ['src/dbos/worker.ts'], {
  env: { ...process.env, MODE: mode, APP_DB: app.url, SYS_DB: sys.url }, encoding: 'utf8', timeout: 90000 });

test('D1 DBOS: a workflow that crashes after step one resumes on relaunch without re-running step one', async () => {
  const crash = run('crash');
  assert.equal(crash.status, 42, crash.stderr);
  assert.deepEqual((await app.pool.query(`SELECT step FROM side_effects ORDER BY at`)).rows.map((r) => r.step), ['one']);
  const rec = run('recover');
  assert.equal(rec.status, 0, rec.stderr);
  assert.match(rec.stdout, /RESULT done/);
  const steps = (await app.pool.query(`SELECT step FROM side_effects ORDER BY at`)).rows.map((r) => r.step);
  assert.deepEqual(steps, ['one', 'two'], 'step one ran once, step two ran after recovery');
  const memo = await sys.pool.query(`SELECT function_name FROM dbos.operation_outputs WHERE workflow_uuid='wf-1' ORDER BY function_id`);
  assert.deepEqual(memo.rows.map((r) => r.function_name), ['stepOne', 'stepTwo']);
});
