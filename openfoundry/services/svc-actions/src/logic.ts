import type { ObjectEdit } from "./clients.js";

/** What action logic may do: read objects. It never writes. */
export interface LogicContext {
  get(objectType: string, primaryKey: string): Promise<Record<string, unknown> | undefined>;
}

/**
 * Either the edits the action makes, or why it refuses to make any.
 *
 * A refusal is reported as a failed submission criterion carrying the message,
 * which is how Foundry tells a caller why an action may not be applied.
 */
export type LogicResult = { edits: ObjectEdit[] } | { refusal: string };

/**
 * The logic behind one action type: a function-backed action in Foundry's
 * terms. It describes its changes as data and performs none of them, so the
 * caller can validate the plan and commit it atomically (the
 * operational-ontology `effects` contract).
 */
export type ActionLogic = (
  params: Record<string, unknown>,
  ctx: LogicContext,
) => Promise<LogicResult>;

const refuse = (refusal: string): LogicResult => ({ refusal });
const today = () => new Date().toISOString().slice(0, 10);
const count = (value: unknown) => (typeof value === "number" ? value : 0);

const completeServiceJob: ActionLogic = async (params, { get }) => {
  const jobId = params.jobId as string;
  const rating = params.customerRating as number;
  const productId = params.productId as string | undefined;
  const quantityUsed = (params.quantityUsed as number | undefined) ?? 0;

  const job = await get("ServiceJob", jobId);
  if (!job) return refuse(`Service job ${jobId} does not exist`);
  if (job.status === "completed") return refuse(`Service job ${jobId} is already completed`);
  if (rating < 1 || rating > 5) return refuse("customerRating must be between 1 and 5");

  const technicianId = job.technicianId as string;
  const technician = await get("Technician", technicianId);
  if (!technician) return refuse(`Technician ${technicianId} does not exist`);

  const edits: ObjectEdit[] = [
    {
      type: "modifyObject",
      objectType: "ServiceJob",
      primaryKey: jobId,
      properties: {
        status: "completed",
        completedDate: today(),
        treatmentUsed: params.treatmentUsed,
        technicianNotes: params.technicianNotes,
        customerRating: rating,
      },
    },
  ];

  if (productId && quantityUsed > 0) {
    const product = await get("TreatmentProduct", productId);
    if (!product) return refuse(`Treatment product ${productId} does not exist`);
    const stock = count(product.stockQty);
    if (stock < quantityUsed) {
      return refuse(`Only ${stock} of ${productId} in stock, ${quantityUsed} requested`);
    }
    edits.push({
      type: "modifyObject",
      objectType: "TreatmentProduct",
      primaryKey: productId,
      properties: { stockQty: stock - quantityUsed },
    });
  }

  edits.push({
    type: "modifyObject",
    objectType: "Technician",
    primaryKey: technicianId,
    properties: { activeJobCount: Math.max(0, count(technician.activeJobCount) - 1) },
  });

  // 11% tax. A generated key: deriving it from the job number collided with
  // the seed's own invoice numbers. The "already completed" refusal above is
  // what keeps a job to one invoice.
  const amount = count(job.amountCharged);
  const tax = Math.round(amount * 0.11);
  const invoiceId = `INV-${crypto.randomUUID()}`;
  edits.push({
    type: "addObject",
    objectType: "Invoice",
    primaryKey: invoiceId,
    properties: {
      invoiceId,
      customerId: job.customerId,
      jobId,
      invoiceDate: today(),
      dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
      amount,
      tax,
      totalAmount: amount + tax,
      status: "draft",
      paymentMethod: "",
      paidDate: "",
      notes: "Auto-generated on job completion",
    },
  });

  return { edits };
};

const scheduleNewJob: ActionLogic = async (params, { get }) => {
  const customerId = params.customerId as string;
  const technicianId = params.technicianId as string;
  if (!(await get("Customer", customerId))) return refuse(`Customer ${customerId} does not exist`);
  const technician = await get("Technician", technicianId);
  if (!technician) return refuse(`Technician ${technicianId} does not exist`);

  // Generated keys, like Foundry's `uniqueIdentifier` rule value: a counter
  // would restart at the same number after every service restart.
  const jobId = `JOB-${crypto.randomUUID()}`;
  const scheduleId = `SCH-${crypto.randomUUID()}`;
  const serviceType = params.serviceType as string;

  return {
    edits: [
      {
        type: "addObject",
        objectType: "ServiceJob",
        primaryKey: jobId,
        properties: {
          jobId,
          customerId,
          technicianId,
          serviceType,
          pestType: params.pestType,
          scheduledDate: params.scheduledDate,
          completedDate: "",
          status: "scheduled",
          priority: params.priority,
          address: params.address,
          treatmentUsed: "",
          amountCharged: 0,
          technicianNotes: "",
          customerRating: 0,
          followUpRequired: "no",
        },
      },
      {
        type: "modifyObject",
        objectType: "Technician",
        primaryKey: technicianId,
        properties: { activeJobCount: count(technician.activeJobCount) + 1 },
      },
      {
        type: "addObject",
        objectType: "Schedule",
        primaryKey: scheduleId,
        properties: {
          scheduleId,
          customerId,
          technicianId,
          vehicleId: "",
          date: params.scheduledDate,
          timeSlot: "08:00-10:00",
          jobId,
          serviceType,
          status: "confirmed",
          notes: `Auto-created for ${serviceType} job`,
        },
      },
    ],
  };
};

const assignTechnician: ActionLogic = async (params, { get }) => {
  const jobId = params.jobId as string;
  const technicianId = params.technicianId as string;
  const vehicleId = params.vehicleId as string | undefined;

  const job = await get("ServiceJob", jobId);
  if (!job) return refuse(`Service job ${jobId} does not exist`);
  if (job.status === "completed") return refuse(`Service job ${jobId} is already completed`);
  const technician = await get("Technician", technicianId);
  if (!technician) return refuse(`Technician ${technicianId} does not exist`);
  if (vehicleId && !(await get("Vehicle", vehicleId))) {
    return refuse(`Vehicle ${vehicleId} does not exist`);
  }

  const edits: ObjectEdit[] = [
    { type: "modifyObject", objectType: "ServiceJob", primaryKey: jobId, properties: { technicianId } },
  ];

  const previousId = job.technicianId as string | undefined;
  if (previousId !== technicianId) {
    const previous = previousId ? await get("Technician", previousId) : undefined;
    if (previousId && previous) {
      edits.push({
        type: "modifyObject",
        objectType: "Technician",
        primaryKey: previousId,
        properties: { activeJobCount: Math.max(0, count(previous.activeJobCount) - 1) },
      });
    }
    edits.push({
      type: "modifyObject",
      objectType: "Technician",
      primaryKey: technicianId,
      properties: { activeJobCount: count(technician.activeJobCount) + 1 },
    });
  }

  if (vehicleId) {
    edits.push({
      type: "modifyObject",
      objectType: "Vehicle",
      primaryKey: vehicleId,
      properties: { assignedTechnicianId: technicianId },
    });
  }

  return { edits };
};

const reorderProduct: ActionLogic = async (params, { get }) => {
  const productId = params.productId as string;
  const quantity = params.quantity as number;
  if (quantity <= 0) return refuse("quantity must be greater than 0");
  const product = await get("TreatmentProduct", productId);
  if (!product) return refuse(`Treatment product ${productId} does not exist`);

  return {
    edits: [
      {
        type: "modifyObject",
        objectType: "TreatmentProduct",
        primaryKey: productId,
        properties: {
          stockQty: count(product.stockQty) + quantity,
          supplier: (params.supplier as string | undefined) || product.supplier || "default supplier",
        },
      },
    ],
  };
};

/**
 * Logic for the pest-control demo's action types, keyed by action type API
 * name. The action types themselves are defined per ontology in svc-ontology
 * (`scripts/demo/seed-pest-control.sh`); an action type with no entry here has
 * no logic and is refused rather than reported as applied.
 *
 * ponytail: keyed by API name across all ontologies; an action type in another
 * ontology with one of these names runs this logic, and its edits are then
 * checked against that ontology's schema. Give logic its own reference on the
 * action type if that ever collides.
 */
export const ACTION_LOGIC: Readonly<Record<string, ActionLogic>> = {
  "complete-service-job": completeServiceJob,
  "schedule-new-job": scheduleNewJob,
  "assign-technician": assignTechnician,
  "reorder-product": reorderProduct,
};
