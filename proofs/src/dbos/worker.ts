/** Child process for the DBOS crash/recovery proof. MODE=crash exits after step one; MODE=recover relaunches. */
import { DBOS } from '@dbos-inc/dbos-sdk';
import pg from 'pg';
const url = process.env.APP_DB!;
const log = new pg.Pool({ connectionString: url, max: 2 });
const mode = process.env.MODE!;

async function stepOne(id: string) { await log.query(`INSERT INTO side_effects (wf, step) VALUES ($1, 'one')`, [id]); return 'one-done'; }
async function stepTwo(id: string) { await log.query(`INSERT INTO side_effects (wf, step) VALUES ($1, 'two')`, [id]); return 'two-done'; }

const wf = DBOS.registerWorkflow(async (id: string) => {
  await DBOS.runStep(() => stepOne(id), { name: 'stepOne' });
  if (mode === 'crash') process.exit(42);           // simulated crash after step one committed
  await DBOS.runStep(() => stepTwo(id), { name: 'stepTwo' });
  return 'done';
}, { name: 'writebackWorkflow' });

DBOS.setConfig({ name: 'proof', systemDatabaseUrl: process.env.SYS_DB! });
await DBOS.launch();
if (mode === 'crash') {
  await DBOS.startWorkflow(wf, { workflowID: 'wf-1' })('wf-1');
  await new Promise((r) => setTimeout(r, 10000));
} else {
  const h = DBOS.retrieveWorkflow('wf-1');
  console.log('RESULT', await h.getResult());
  await DBOS.shutdown(); await log.end();
}
