import { generateRid } from "@openfoundry/rid";
import type { ObjectEdit, ReadVersion } from "../clients.js";

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "STALE";

/**
 * An action's evaluated edit plan, held for a person to approve. The plan
 * keeps the object versions it was computed from, so approval commits exactly
 * what was reviewed, or nothing if any of those objects changed since.
 */
export interface Proposal {
  rid: string;
  ontologyRid: string;
  actionType: string;
  parameters: Record<string, unknown>;
  edits: ObjectEdit[];
  reads: ReadVersion[];
  proposedBy?: string;
  status: ProposalStatus;
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
  commitId?: string;
}

export type NewProposal = Pick<Proposal, "ontologyRid" | "actionType" | "parameters" | "edits" | "reads" | "proposedBy">;
export type Decision = Pick<Proposal, "status" | "decidedBy" | "reason" | "commitId">;

type MaybePromise<T> = T | Promise<T>;

export interface ProposalStore {
  create(proposal: NewProposal): MaybePromise<Proposal>;
  get(ontologyRid: string, rid: string): MaybePromise<Proposal | undefined>;
  list(ontologyRid: string, status?: ProposalStatus): MaybePromise<Proposal[]>;
  /**
   * Record a decision on a PENDING proposal. Returns the updated proposal, or
   * `undefined` if it was no longer PENDING: two approvers racing cannot both
   * decide it.
   */
  decide(ontologyRid: string, rid: string, decision: Decision): MaybePromise<Proposal | undefined>;
}

export const newProposalRid = () => generateRid("actions", "proposal").toString();

export class MemoryProposalStore implements ProposalStore {
  private readonly proposals: Proposal[] = [];

  create(p: NewProposal): Proposal {
    const proposal: Proposal = { ...p, rid: newProposalRid(), status: "PENDING", createdAt: new Date().toISOString() };
    this.proposals.push(proposal);
    return proposal;
  }

  get(ontologyRid: string, rid: string): Proposal | undefined {
    return this.proposals.find((p) => p.ontologyRid === ontologyRid && p.rid === rid);
  }

  list(ontologyRid: string, status?: ProposalStatus): Proposal[] {
    return this.proposals.filter((p) => p.ontologyRid === ontologyRid && (!status || p.status === status));
  }

  decide(ontologyRid: string, rid: string, decision: Decision): Proposal | undefined {
    const p = this.get(ontologyRid, rid);
    if (!p || p.status !== "PENDING") return undefined;
    Object.assign(p, decision, { decidedAt: new Date().toISOString() });
    return p;
  }
}
