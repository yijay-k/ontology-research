/**
 * svc-datasets tells svc-objects when a dataset's files change, so the object
 * types backed by it resync - after uploads, deletes and committed
 * transactions, and never after a read or a failed write.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { DatasetStore } from "../src/store/dataset-store.js";
import { FileStore } from "../src/store/file-store.js";

let app: FastifyInstance;
let changed: string[];
let datasetRid: string;

const settle = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(async () => {
  changed = [];
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    datasetStore: new DatasetStore(),
    fileStore: new FileStore(),
    onDatasetChanged: async (rid) => void changed.push(rid),
  });
  datasetRid = (await app.inject({ method: "POST", url: "/api/v2/datasets", payload: { name: "customers" } })).json().rid;
});

const upload = (rid = datasetRid) =>
  app.inject({
    method: "PUT",
    url: `/api/v2/datasets/${rid}/files/customers.csv`,
    headers: { "content-type": "text/csv" },
    payload: "id,name\nc1,Ann\n",
  });

describe("dataset change hook", () => {
  it("fires after an upload and a delete", async () => {
    await upload();
    await app.inject({ method: "DELETE", url: `/api/v2/datasets/${datasetRid}/files/customers.csv` });
    await settle();
    expect(changed).toEqual([datasetRid, datasetRid]);
  });

  it("fires after a transaction commit, not when it opens", async () => {
    const branchRid = (await app.inject({ method: "GET", url: `/api/v2/datasets/${datasetRid}/branches/main` })).json().rid;
    const txn = await app.inject({
      method: "POST",
      url: `/api/v2/datasets/${datasetRid}/transactions`,
      payload: { branchRid, type: "SNAPSHOT" },
    });
    await settle();
    expect(changed).toEqual([]);

    await app.inject({ method: "POST", url: `/api/v2/datasets/${datasetRid}/transactions/${txn.json().rid}/commit` });
    await settle();
    expect(changed).toEqual([datasetRid]);
  });

  it("does not fire after a read or a failed write", async () => {
    await upload();
    await settle();
    changed = [];
    await app.inject({ method: "GET", url: `/api/v2/datasets/${datasetRid}/files/customers.csv` });
    await upload("ri.datasets.main.dataset.missing");
    await settle();
    expect(changed).toEqual([]);
  });
});
