/**
 * Dataset-backed object types, end to end over real HTTP: svc-ontology,
 * svc-datasets and svc-objects each listen on an ephemeral port and talk to
 * each other exactly as deployed. Uploading a CSV to the backing dataset
 * syncs the objects with no further call, and an Action's edit survives a
 * later re-upload.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";

describe("Dataset-backed object types", () => {
  let ontologyApp: FastifyInstance;
  let datasetsApp: FastifyInstance;
  let objectsApp: FastifyInstance;
  let ontologyRid: string;
  let datasetRid: string;

  const url = (app: FastifyInstance) => {
    const address = app.server.address();
    if (!address || typeof address === "string") throw new Error("not listening");
    return `http://127.0.0.1:${address.port}`;
  };

  beforeAll(async () => {
    const [
      { createServer: createOntologyServer },
      { createServer: createDatasetsServer },
      { createServer: createObjectsServer },
      { OntologyStore },
      { ObjectStore },
      { LinkStore },
      { DatasetStore },
      { FileStore },
      { httpSyncSources },
    ] = await Promise.all([
      import("../../services/svc-ontology/src/server.js"),
      import("../../services/svc-datasets/src/server.js"),
      import("../../services/svc-objects/src/server.js"),
      import("../../services/svc-ontology/src/store/ontology-store.js"),
      import("../../services/svc-objects/src/store/object-store.js"),
      import("../../services/svc-objects/src/store/link-store.js"),
      import("../../services/svc-datasets/src/store/dataset-store.js"),
      import("../../services/svc-datasets/src/store/file-store.js"),
      import("../../services/svc-objects/src/sync/http-sources.js"),
    ]);
    const quiet = { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" };

    ontologyApp = await createOntologyServer({ config: quiet as never, store: new OntologyStore(null) });
    await ontologyApp.listen({ port: 0, host: "127.0.0.1" });

    // svc-datasets needs svc-objects' address and svc-objects needs
    // svc-datasets', so svc-datasets notifies through a late-bound URL.
    let objectsUrl = "";
    datasetsApp = await createDatasetsServer({
      config: quiet as never,
      datasetStore: new DatasetStore(),
      fileStore: new FileStore(),
      onDatasetChanged: async (rid: string) => {
        const res = await fetch(`${objectsUrl}/internal/datasets/${rid}/changed`, { method: "POST" });
        if (!res.ok) throw new Error(`sync trigger failed: ${res.status}`);
      },
    });
    await datasetsApp.listen({ port: 0, host: "127.0.0.1" });

    objectsApp = await createObjectsServer({
      config: quiet as never,
      store: new ObjectStore(null),
      linkStore: new LinkStore(null),
      syncSources: httpSyncSources(url(ontologyApp), url(datasetsApp)),
    });
    await objectsApp.listen({ port: 0, host: "127.0.0.1" });
    objectsUrl = url(objectsApp);

    ontologyRid = (
      await ontologyApp.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "crm", displayName: "CRM", description: "" } })
    ).json().rid;
    datasetRid = (
      await datasetsApp.inject({ method: "POST", url: "/api/v2/datasets", payload: { name: "customers" } })
    ).json().rid;

    const created = await ontologyApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectTypes`,
      payload: {
        apiName: "Customer",
        description: "A customer",
        primaryKeyApiName: "id",
        primaryKeyType: "STRING",
        titlePropertyApiName: "name",
        properties: {
          id: { type: "STRING", nullable: false, multiplicity: "SINGLE" },
          name: { type: "STRING", nullable: true, multiplicity: "SINGLE" },
          balance: { type: "INTEGER", nullable: true, multiplicity: "SINGLE" },
        },
        implements: [],
        status: "ACTIVE",
        datasources: [
          {
            definition: {
              type: "dataset",
              datasetRid,
              propertyMapping: {
                id: { type: "column", column: "customer_id" },
                name: { type: "column", column: "name" },
                balance: { type: "column", column: "balance" },
              },
            },
          },
        ],
      },
    });
    expect(created.statusCode).toBe(201);
  }, 60_000);

  afterAll(async () => {
    await Promise.all([ontologyApp?.close(), datasetsApp?.close(), objectsApp?.close()]);
  });

  const upload = (csv: string) =>
    datasetsApp.inject({
      method: "PUT",
      url: `/api/v2/datasets/${datasetRid}/files/customers.csv`,
      headers: { "content-type": "text/csv" },
      payload: csv,
    });

  const customers = async () =>
    (await objectsApp.inject({ method: "GET", url: `/api/v2/ontologies/${ontologyRid}/objects/Customer` }))
      .json()
      .data.map((o: { primaryKey: string; properties: Record<string, unknown> }) => [o.primaryKey, o.properties])
      .sort();

  /** The sync runs after the upload's response; wait for it to land. */
  const eventually = async (check: () => Promise<void>) => {
    for (let i = 0; ; i++) {
      try {
        return await check();
      } catch (err) {
        if (i >= 50) throw err;
        await new Promise((r) => setTimeout(r, 20));
      }
    }
  };

  it("syncs objects from an uploaded CSV with no further call", async () => {
    expect((await upload("customer_id,name,balance\nc1,Ann,100\nc2,Bob,250\n")).statusCode).toBe(201);
    await eventually(async () =>
      expect(await customers()).toEqual([
        ["c1", { id: "c1", name: "Ann", balance: 100 }],
        ["c2", { id: "c2", name: "Bob", balance: 250 }],
      ]),
    );
  });

  it("keeps an Action's edit when the dataset is re-uploaded, and drops rows the source dropped", async () => {
    const edit = await objectsApp.inject({
      method: "POST",
      url: `/internal/ontologies/${ontologyRid}/edits`,
      payload: { edits: [{ type: "modifyObject", objectType: "Customer", primaryKey: "c1", properties: { name: "Ann (VIP)" } }] },
    });
    expect(edit.statusCode).toBe(200);

    await upload("customer_id,name,balance\nc1,Ann,90\n");
    await eventually(async () =>
      expect(await customers()).toEqual([["c1", { id: "c1", name: "Ann (VIP)", balance: 90 }]]),
    );
  });

  it("leaves the objects as they were when an upload is malformed", async () => {
    await upload("customer_id,name,balance\nc1,Ann,ninety\n");
    await new Promise((r) => setTimeout(r, 200));
    expect(await customers()).toEqual([["c1", { id: "c1", name: "Ann (VIP)", balance: 90 }]]);
  });
});
