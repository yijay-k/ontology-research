import type {
  ActionTypeDefinition,
  ObjectTypeDefinition,
} from "@openfoundry/ontology-schema";
import { ErrorCode, OpenFoundryApiError } from "@openfoundry/errors";
import type { CommitOptions, ObjectEdit, ObjectsGateway, OntologySource } from "../src/clients.js";

export const ONTOLOGY_RID = "ri.ontology.main.ontology.pest";
export const OTHER_ONTOLOGY_RID = "ri.ontology.main.ontology.other";

export const TEST_CONFIG = {
  port: 0,
  host: "127.0.0.1",
  logLevel: "silent",
  nodeEnv: "test",
  objectsServiceUrl: "http://unused",
  ontologyServiceUrl: "http://unused",
};

const str = { type: "string", nullable: true, multiplicity: "SINGLE" };
const int = { type: "integer", nullable: true, multiplicity: "SINGLE" };

function objectType(apiName: string, key: string, props: Record<string, typeof str & { editable?: boolean }>): ObjectTypeDefinition {
  // Shaped like the demo seed's payload, which names the key `primaryKey`.
  return { apiName, primaryKey: key, properties: { [key]: str, ...props } } as unknown as ObjectTypeDefinition;
}

const OBJECT_TYPES: ObjectTypeDefinition[] = [
  objectType("ServiceJob", "jobId", {
    customerId: str, technicianId: str, status: str, completedDate: str, treatmentUsed: str,
    technicianNotes: str, customerRating: int,
    // The source system owns what was charged; actions may not modify it.
    amountCharged: { ...int, editable: false },
  }),
  objectType("Technician", "technicianId", { name: str, activeJobCount: int }),
  objectType("Vehicle", "vehicleId", { assignedTechnicianId: str }),
  objectType("TreatmentProduct", "productId", { stockQty: int, supplier: str }),
  objectType("Invoice", "invoiceId", {
    customerId: str, jobId: str, invoiceDate: str, dueDate: str, amount: int, tax: int,
    totalAmount: int, status: str, paymentMethod: str, paidDate: str, notes: str,
  }),
];

const param = (type: string, required = true) => ({ type, required }) as never;

export const ACTION_TYPES: ActionTypeDefinition[] = [
  {
    apiName: "assign-technician",
    description: "Reassign a job",
    parameters: { jobId: param("string"), technicianId: param("string"), vehicleId: param("string", false) },
    modifiedEntities: {
      ServiceJob: { created: false, modified: true },
      Technician: { created: false, modified: true },
      Vehicle: { created: false, modified: true },
    },
    status: "ACTIVE",
  },
  {
    apiName: "complete-service-job",
    description: "Complete a job",
    parameters: {
      jobId: param("string"), treatmentUsed: param("string"), technicianNotes: param("string"),
      customerRating: param("integer"), productId: param("string", false), quantityUsed: param("integer", false),
    },
    modifiedEntities: {
      ServiceJob: { created: false, modified: true },
      TreatmentProduct: { created: false, modified: true },
      Technician: { created: false, modified: true },
      Invoice: { created: true, modified: false },
    },
    status: "ACTIVE",
  },
  {
    apiName: "reorder-product",
    description: "Reorder stock",
    parameters: { productId: param("string"), quantity: param("integer"), supplier: param("string", false) },
    modifiedEntities: { TreatmentProduct: { created: false, modified: true } },
    status: "ACTIVE",
  },
  {
    apiName: "no-logic",
    description: "Declared in the ontology, with no logic behind it",
    parameters: {},
    modifiedEntities: {},
    status: "ACTIVE",
  },
];

/** svc-ontology, holding the pest-control types in one ontology only. */
export function fakeOntology(): OntologySource {
  return {
    getActionType: async (rid, apiName) =>
      rid === ONTOLOGY_RID ? ACTION_TYPES.find((a) => a.apiName === apiName) : undefined,
    getObjectType: async (rid, apiName) =>
      rid === ONTOLOGY_RID ? OBJECT_TYPES.find((o) => o.apiName === apiName) : undefined,
  };
}

export interface FakeObjects extends ObjectsGateway {
  readonly rows: Map<string, Record<string, unknown>>;
  readonly versions: Map<string, number>;
  /** How many plans were committed. */
  commits: number;
  /** Every plan handed to `applyEdits`, committed or not. */
  readonly plans: ObjectEdit[][];
  /** Committed plans by idempotency key, as svc-objects' commit log keeps them. */
  readonly keyed: Map<string, ObjectEdit[]>;
  /** The options handed to each `applyEdits` call. */
  readonly commitOptions: CommitOptions[];
  /** Make the next commit fail, as if svc-objects refused it. */
  failNextCommit: boolean;
  /** Runs just before each commit: a concurrent writer can change rows here. */
  beforeCommit?: () => void;
  /** A write by someone else: merges properties and bumps the version. */
  write(type: string, pk: string, properties: Record<string, unknown>): void;
}

const key = (type: string, pk: string) => `${type}/${pk}`;

/**
 * svc-objects: reads with versions, plus an all-or-nothing commit that refuses
 * a stale `expectedVersion` with `ObjectChanged`, like `ObjectStore.applyEdits`.
 */
export function fakeObjects(seed: Record<string, Record<string, unknown>> = {}): FakeObjects {
  const rows = new Map(Object.entries(seed).map(([k, v]) => [k, { ...v }]));
  const versions = new Map([...rows.keys()].map((k) => [k, 1]));
  const fake: FakeObjects = {
    rows,
    versions,
    commits: 0,
    plans: [],
    keyed: new Map(),
    commitOptions: [],
    failNextCommit: false,
    write(type, pk, properties) {
      const k = key(type, pk);
      rows.set(k, { ...rows.get(k), ...properties });
      versions.set(k, (versions.get(k) ?? 0) + 1);
    },
    getObject: async (_rid, type, pk) => {
      const k = key(type, pk);
      const row = rows.get(k);
      return row ? { properties: { ...row }, version: versions.get(k)! } : undefined;
    },
    getCommit: async (_rid, idempotencyKey) => {
      const edits = fake.keyed.get(idempotencyKey);
      return edits ? { commitId: `commit-${idempotencyKey}`, edits } : undefined;
    },
    applyEdits: async (_rid, edits: ObjectEdit[], options: CommitOptions = {}) => {
      fake.plans.push(edits);
      fake.commitOptions.push(options);
      if (options.idempotencyKey && fake.keyed.has(options.idempotencyKey)) {
        return { commitId: `commit-${options.idempotencyKey}`, replayed: true };
      }
      fake.beforeCommit?.();
      if (fake.failNextCommit) {
        fake.failNextCommit = false;
        throw new Error("svc-objects refused the edits (500)");
      }
      const next = new Map(rows);
      for (const edit of edits) {
        const k = key(edit.objectType, edit.primaryKey);
        if (edit.type === "addObject") {
          if (next.has(k)) throw new Error(`svc-objects refused the edits (409): ${k} exists`);
          next.set(k, { ...edit.properties });
          continue;
        }
        if (!next.has(k)) throw new Error(`svc-objects refused the edits (404): ${k}`);
        if (edit.expectedVersion !== undefined && versions.get(k) !== edit.expectedVersion) {
          throw new OpenFoundryApiError({
            errorCode: ErrorCode.CONFLICT,
            errorName: "ObjectChanged",
            message: `${k} changed`,
          });
        }
        if (edit.type === "modifyObject") next.set(k, { ...next.get(k), ...edit.properties });
        else next.delete(k);
      }
      for (const edit of edits) {
        const k = key(edit.objectType, edit.primaryKey);
        if (edit.type === "deleteObject") versions.delete(k);
        else versions.set(k, (versions.get(k) ?? 0) + 1);
      }
      rows.clear();
      for (const [k, v] of next) rows.set(k, v);
      fake.commits++;
      if (options.idempotencyKey) fake.keyed.set(options.idempotencyKey, edits);
      return { commitId: `commit-${fake.commits}`, replayed: false };
    },
  };
  return fake;
}

/** A small pest-control world: one open job, two technicians, a van and a product. */
export function pestControlRows(): Record<string, Record<string, unknown>> {
  return {
    "ServiceJob/JOB-1": {
      jobId: "JOB-1", customerId: "CUST-1", technicianId: "TECH-1", status: "scheduled", amountCharged: 1000,
    },
    "ServiceJob/JOB-DONE": {
      jobId: "JOB-DONE", customerId: "CUST-1", technicianId: "TECH-1", status: "completed", amountCharged: 500,
    },
    "Technician/TECH-1": { technicianId: "TECH-1", activeJobCount: 2 },
    "Technician/TECH-2": { technicianId: "TECH-2", activeJobCount: 0 },
    "Vehicle/VAN-1": { vehicleId: "VAN-1", assignedTechnicianId: "TECH-1" },
    "TreatmentProduct/PROD-1": { productId: "PROD-1", stockQty: 5, supplier: "Acme" },
  };
}
