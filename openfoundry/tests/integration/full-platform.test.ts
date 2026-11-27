import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";

describe("Full platform flow: compass, ontology, objects, actions, sentinel, datasets", () => {
  let compassApp: FastifyInstance;
  let ontologyApp: FastifyInstance;
  let objectsApp: FastifyInstance;
  let actionsApp: FastifyInstance;
  let sentinelApp: FastifyInstance;
  let datasetsApp: FastifyInstance;

  let spaceRid: string;
  let projectRid: string;
  let ontologyRid: string;
  let monitorRid: string;
  let datasetRid: string;

  beforeAll(async () => {
    const [
      { createServer: createCompassServer },
      { createServer: createOntologyServer },
      { createServer: createObjectsServer },
      { createServer: createActionsServer },
      { createServer: createSentinelServer },
      { createServer: createDatasetsServer },
    ] = await Promise.all([
      import("../../services/svc-compass/src/server.js"),
      import("../../services/svc-ontology/src/server.js"),
      import("../../services/svc-objects/src/server.js"),
      import("../../services/svc-actions/src/server.js"),
      import("../../services/svc-sentinel/src/server.js"),
      import("../../services/svc-datasets/src/server.js"),
    ]);

    const [{ OntologyStore }, { ObjectStore }, { LinkStore }] = await Promise.all([
      import("../../services/svc-ontology/src/store/ontology-store.js"),
      import("../../services/svc-objects/src/store/object-store.js"),
      import("../../services/svc-objects/src/store/link-store.js"),
    ]);

    // In-memory stores (`null` data file) keep this suite off the shared
    // /tmp/openfoundry-data snapshot, which running services and other suites
    // also write to; sharing it made object counts depend on run order.

    [compassApp, ontologyApp, objectsApp, actionsApp, sentinelApp, datasetsApp] =
      await Promise.all([
        createCompassServer(),
        createOntologyServer({ store: new OntologyStore(null) }),
        createObjectsServer({
          store: new ObjectStore(null),
          linkStore: new LinkStore(null),
        }),
        createActionsServer(),
        createSentinelServer(),
        createDatasetsServer(),
      ]);
  });

  afterAll(async () => {
    await Promise.all([
      compassApp?.close(),
      ontologyApp?.close(),
      objectsApp?.close(),
      actionsApp?.close(),
      sentinelApp?.close(),
      datasetsApp?.close(),
    ]);
  });

  // -------------------------------------------------------------------------
  // Step 1: Compass — create workspace structure
  // -------------------------------------------------------------------------

  it("creates a compass space and project for the platform", async () => {
    const spaceRes = await compassApp.inject({
      method: "POST",
      url: "/api/v2/compass/resources",
      headers: { "content-type": "application/json" },
      payload: {
        name: "HR Platform",
        type: "SPACE",
        description: "Human resources platform workspace",
      },
    });
    expect(spaceRes.statusCode).toBe(201);
    spaceRid = spaceRes.json().rid;

    const projectRes = await compassApp.inject({
      method: "POST",
      url: "/api/v2/compass/resources",
      headers: { "content-type": "application/json" },
      payload: {
        name: "Employee Management",
        type: "PROJECT",
        parentRid: spaceRid,
        description: "Employee data and workflows",
      },
    });
    expect(projectRes.statusCode).toBe(201);
    projectRid = projectRes.json().rid;

    // Verify the hierarchy
    const children = await compassApp.inject({
      method: "GET",
      url: `/api/v2/compass/resources/${spaceRid}/children`,
    });
    expect(children.json().data.length).toBe(1);
    expect(children.json().data[0].name).toBe("Employee Management");
  });

  // -------------------------------------------------------------------------
  // Step 2: Ontology — define the domain model
  // -------------------------------------------------------------------------

  it("creates an ontology with Employee and Department types", async () => {
    const ontRes = await ontologyApp.inject({
      method: "POST",
      url: "/api/v2/ontologies",
      headers: { "content-type": "application/json" },
      payload: {
        apiName: "hr-platform",
        displayName: "HR Platform Ontology",
        description: "Domain model for HR platform",
      },
    });
    expect(ontRes.statusCode).toBe(201);
    ontologyRid = ontRes.json().rid;

    // Create Employee type
    const empRes = await ontologyApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectTypes`,
      headers: { "content-type": "application/json" },
      payload: {
        apiName: "Employee",
        description: "An employee",
        primaryKeyApiName: "id",
        primaryKeyType: "STRING",
        titlePropertyApiName: "name",
        properties: {
          id: { type: "STRING", nullable: false, multiplicity: "SINGLE" },
          name: { type: "STRING", nullable: false, multiplicity: "SINGLE" },
          department: { type: "STRING", nullable: true, multiplicity: "SINGLE" },
          salary: { type: "DOUBLE", nullable: true, multiplicity: "SINGLE" },
        },
        implements: [],
        status: "ACTIVE",
      },
    });
    expect(empRes.statusCode).toBe(201);

    // Create Department type
    const deptRes = await ontologyApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectTypes`,
      headers: { "content-type": "application/json" },
      payload: {
        apiName: "Department",
        description: "A department",
        primaryKeyApiName: "deptId",
        primaryKeyType: "STRING",
        titlePropertyApiName: "deptName",
        properties: {
          deptId: { type: "STRING", nullable: false, multiplicity: "SINGLE" },
          deptName: { type: "STRING", nullable: false, multiplicity: "SINGLE" },
          headcount: { type: "INTEGER", nullable: true, multiplicity: "SINGLE" },
        },
        implements: [],
        status: "ACTIVE",
      },
    });
    expect(deptRes.statusCode).toBe(201);
  });

  it("lists the created object types", async () => {
    const res = await ontologyApp.inject({
      method: "GET",
      url: `/api/v2/ontologies/${ontologyRid}/objectTypes`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBe(2);
    const names = res.json().data.map((t: { apiName: string }) => t.apiName).sort();
    expect(names).toEqual(["Department", "Employee"]);
  });

  // -------------------------------------------------------------------------
  // Step 3: Objects — create and manage data
  // -------------------------------------------------------------------------

  it("creates Employee and Department objects", async () => {
    // Create departments
    for (const dept of [
      { deptId: "eng", deptName: "Engineering", headcount: 50 },
      { deptId: "sales", deptName: "Sales", headcount: 30 },
      { deptId: "hr", deptName: "Human Resources", headcount: 10 },
    ]) {
      const res = await objectsApp.inject({
        method: "POST",
        url: `/api/v2/ontologies/${ontologyRid}/objects/Department`,
        headers: { "content-type": "application/json" },
        payload: { primaryKey: dept.deptId, properties: dept },
      });
      expect(res.statusCode).toBe(201);
    }

    // Create employees
    const employees = [
      { id: "e1", name: "Alice", department: "eng", salary: 120000 },
      { id: "e2", name: "Bob", department: "eng", salary: 110000 },
      { id: "e3", name: "Charlie", department: "sales", salary: 95000 },
      { id: "e4", name: "Diana", department: "sales", salary: 105000 },
      { id: "e5", name: "Eve", department: "hr", salary: 90000 },
    ];
    for (const emp of employees) {
      const res = await objectsApp.inject({
        method: "POST",
        url: `/api/v2/ontologies/${ontologyRid}/objects/Employee`,
        headers: { "content-type": "application/json" },
        payload: { primaryKey: emp.id, properties: emp },
      });
      expect(res.statusCode).toBe(201);
    }
  });

  it("queries objects with filters", async () => {
    // Filter employees in the engineering department
    const res = await objectsApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectSets/loadObjects`,
      headers: { "content-type": "application/json" },
      payload: {
        objectSet: {
          type: "FILTER",
          objectSet: { type: "BASE", objectType: "Employee" },
          filter: { type: "EQUALS", property: "department", value: "eng" },
        },
      },
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(data.length).toBe(2);
    const names = data.map((o: { properties: { name: string } }) => o.properties.name).sort();
    expect(names).toEqual(["Alice", "Bob"]);
  });

  it("aggregates objects to count and compute metrics", async () => {
    // Count all employees
    const countRes = await objectsApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectSets/aggregate`,
      headers: { "content-type": "application/json" },
      payload: {
        objectSet: { type: "BASE", objectType: "Employee" },
        aggregation: [{ type: "COUNT" }],
      },
    });
    expect(countRes.statusCode).toBe(200);
    expect(countRes.json().data[0].value).toBe(5);

    // Compute average salary
    const avgRes = await objectsApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectSets/aggregate`,
      headers: { "content-type": "application/json" },
      payload: {
        objectSet: { type: "BASE", objectType: "Employee" },
        aggregation: [{ type: "AVG", property: "salary" }],
      },
    });
    expect(avgRes.statusCode).toBe(200);
    expect(avgRes.json().data[0].value).toBe(104000); // (120+110+95+105+90) / 5 * 1000
  });

  // -------------------------------------------------------------------------
  // Step 4: Actions — register and execute
  // -------------------------------------------------------------------------

  it("defines an action type and applies it through svc-ontology and svc-objects", async () => {
    const typeRes = await ontologyApp.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/actionTypes`,
      payload: {
        apiName: "promoteEmployee",
        description: "Raise an employee's salary",
        parameters: {
          employeeId: { type: "STRING", required: true },
          newSalary: { type: "DOUBLE", required: true },
        },
        modifiedEntities: { Employee: { created: false, modified: true } },
        status: "ACTIVE",
      },
    });
    expect(typeRes.statusCode).toBe(201);

    // svc-actions talks to the two real services in-process, over their routes.
    const getJson = async (app: FastifyInstance, url: string) => {
      const res = await app.inject({ method: "GET", url });
      return res.statusCode === 404 ? undefined : res.json();
    };
    const { createServer: createActionsServer } = await import(
      "../../services/svc-actions/src/server.js"
    );
    await actionsApp.close();
    actionsApp = await createActionsServer({
      ontology: {
        getActionType: (rid, name) => getJson(ontologyApp, `/api/v2/ontologies/${rid}/actionTypes/${name}`),
        getObjectType: (rid, name) => getJson(ontologyApp, `/api/v2/ontologies/${rid}/objectTypes/${name}`),
      },
      objects: {
        getObject: (rid, type, pk) =>
          getJson(objectsApp, `/internal/ontologies/${rid}/objects/${type}/${pk}`),
        applyEdits: async (rid, edits) => {
          const res = await objectsApp.inject({
            method: "POST",
            url: `/internal/ontologies/${rid}/edits`,
            payload: { edits },
          });
          if (res.statusCode !== 204) throw new Error(`edits refused: ${res.statusCode}`);
        },
      },
      logic: {
        promoteEmployee: async (params, { get }) => {
          const employee = await get("Employee", params.employeeId as string);
          if (!employee) return { refusal: `No employee ${params.employeeId}` };
          if ((params.newSalary as number) <= (employee.salary as number)) {
            return { refusal: "A promotion must raise the salary" };
          }
          return {
            edits: [{
              type: "modifyObject",
              objectType: "Employee",
              primaryKey: params.employeeId as string,
              properties: { salary: params.newSalary },
            }],
          };
        },
      },
    });

    const apply = (parameters: Record<string, unknown>, options?: Record<string, unknown>) =>
      actionsApp.inject({
        method: "POST",
        url: `/api/v2/ontologies/${ontologyRid}/actions/promoteEmployee/apply`,
        payload: { parameters, ...(options ? { options } : {}) },
      });
    const salary = async () =>
      (await getJson(objectsApp, `/api/v2/ontologies/${ontologyRid}/objects/Employee/e1`)).properties.salary;

    const before = await salary();

    const dryRun = await apply({ employeeId: "e1", newSalary: 140000 }, { mode: "VALIDATE_ONLY" });
    expect(dryRun.json().validation.result).toBe("VALID");
    expect(await salary()).toBe(before);

    const refused = await apply({ employeeId: "e1", newSalary: 1 });
    expect(refused.statusCode).toBe(200);
    expect(refused.json().validation.submissionCriteria[0].configuredFailureMessage).toBe(
      "A promotion must raise the salary",
    );
    expect(await salary()).toBe(before);

    const res = await apply({ employeeId: "e1", newSalary: 140000 }, { returnEdits: "ALL" });
    expect(res.statusCode).toBe(200);
    expect(res.json().validation.result).toBe("VALID");
    expect(res.json().edits.edits).toEqual([
      { type: "modifyObject", objectType: "Employee", primaryKey: "e1" },
    ]);
    expect(await salary()).toBe(140000);
  });

  // -------------------------------------------------------------------------
  // Step 5: Sentinel — set up monitoring
  // -------------------------------------------------------------------------

  it("sets up a monitor for employee changes", async () => {
    const res = await sentinelApp.inject({
      method: "POST",
      url: "/api/v2/monitors",
      headers: { "content-type": "application/json" },
      payload: {
        name: "Employee Promotion Monitor",
        description: "Fires when employee salary changes significantly",
        objectType: "Employee",
        trigger: {
          type: "OBJECT_CHANGED",
          config: { objectType: "Employee" },
        },
        effects: [
          { type: "LOG", config: { message: "Employee promotion detected" } },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    monitorRid = res.json().rid;
    expect(res.json().status).toBe("ACTIVE");
  });

  // -------------------------------------------------------------------------
  // Step 6: Datasets — create supporting data
  // -------------------------------------------------------------------------

  it("creates a dataset for employee data export", async () => {
    const res = await datasetsApp.inject({
      method: "POST",
      url: "/api/v2/datasets",
      headers: { "content-type": "application/json" },
      payload: {
        name: "employee-export",
        description: "Exported employee data",
      },
    });
    expect(res.statusCode).toBe(201);
    datasetRid = res.json().rid;

    // Upload employee data as CSV
    const csv = "id,name,department,salary\ne1,Alice,eng,120000\ne2,Bob,eng,110000\ne3,Charlie,sales,95000\n";
    const uploadRes = await datasetsApp.inject({
      method: "PUT",
      url: `/api/v2/datasets/${datasetRid}/files/employees.csv`,
      headers: { "content-type": "text/csv" },
      payload: csv,
    });
    expect(uploadRes.statusCode).toBe(201);
  });

  // -------------------------------------------------------------------------
  // Step 7: Cross-service verification
  // -------------------------------------------------------------------------

  it("verifies the full platform state across all services", async () => {
    // Compass: workspace exists
    const spaceRes = await compassApp.inject({
      method: "GET",
      url: `/api/v2/compass/resources/${spaceRid}`,
    });
    expect(spaceRes.statusCode).toBe(200);
    expect(spaceRes.json().name).toBe("HR Platform");

    // Ontology: types exist
    const typesRes = await ontologyApp.inject({
      method: "GET",
      url: `/api/v2/ontologies/${ontologyRid}/objectTypes`,
    });
    expect(typesRes.json().data.length).toBe(2);

    // Objects: data exists
    const objRes = await objectsApp.inject({
      method: "GET",
      url: `/api/v2/ontologies/${ontologyRid}/objects/Employee`,
    });
    expect(objRes.json().data.length).toBe(5);

    // Sentinel: monitor exists
    const monRes = await sentinelApp.inject({
      method: "GET",
      url: `/api/v2/monitors/${monitorRid}`,
    });
    expect(monRes.statusCode).toBe(200);
    expect(monRes.json().status).toBe("ACTIVE");

    // Datasets: file exists
    const fileRes = await datasetsApp.inject({
      method: "GET",
      url: `/api/v2/datasets/${datasetRid}/files`,
    });
    expect(fileRes.json().data.length).toBe(1);
    expect(fileRes.json().data[0].path).toBe("employees.csv");
  });

  // -------------------------------------------------------------------------
  // Step 8: Cleanup
  // -------------------------------------------------------------------------

  it("cleans up all platform resources", async () => {
    // Delete dataset
    const delDataset = await datasetsApp.inject({
      method: "DELETE",
      url: `/api/v2/datasets/${datasetRid}`,
    });
    expect(delDataset.statusCode).toBe(204);

    // Delete monitor
    const delMonitor = await sentinelApp.inject({
      method: "DELETE",
      url: `/api/v2/monitors/${monitorRid}`,
    });
    expect(delMonitor.statusCode).toBe(204);

    // Delete ontology
    const delOntology = await ontologyApp.inject({
      method: "DELETE",
      url: `/api/v2/ontologies/${ontologyRid}`,
    });
    expect(delOntology.statusCode).toBe(204);

    // Delete compass space recursively
    const delSpace = await compassApp.inject({
      method: "DELETE",
      url: `/api/v2/compass/resources/${spaceRid}?recursive=true`,
    });
    expect(delSpace.statusCode).toBe(204);
  });
});
