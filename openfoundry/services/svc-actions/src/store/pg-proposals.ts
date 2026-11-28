import type pg from "pg";
import { newProposalRid, type Decision, type NewProposal, type Proposal, type ProposalStatus, type ProposalStore } from "./proposals.js";

interface Row {
  rid: string;
  ontology_rid: string;
  action_type: string;
  parameters: Record<string, unknown>;
  edits: Proposal["edits"];
  reads: Proposal["reads"];
  proposed_by: string | null;
  status: ProposalStatus;
  created_at: Date | string;
  decided_by: string | null;
  decided_at: Date | string | null;
  reason: string | null;
  commit_id: string | null;
}

const toProposal = (r: Row): Proposal => ({
  rid: r.rid,
  ontologyRid: r.ontology_rid,
  actionType: r.action_type,
  parameters: r.parameters,
  edits: r.edits,
  reads: r.reads,
  status: r.status,
  createdAt: new Date(r.created_at).toISOString(),
  ...(r.proposed_by ? { proposedBy: r.proposed_by } : {}),
  ...(r.decided_by ? { decidedBy: r.decided_by } : {}),
  ...(r.decided_at ? { decidedAt: new Date(r.decided_at).toISOString() } : {}),
  ...(r.reason ? { reason: r.reason } : {}),
  ...(r.commit_id ? { commitId: r.commit_id } : {}),
});

/** Proposals in `action_proposals` (db/migrations/021, mirrored in scripts/migrate.sql). */
export class PgProposalStore implements ProposalStore {
  constructor(private readonly pool: pg.Pool) {}

  async create(p: NewProposal): Promise<Proposal> {
    const { rows } = await this.pool.query<Row>({
      text: `INSERT INTO action_proposals (rid, ontology_rid, action_type, parameters, edits, reads, proposed_by, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING') RETURNING *`,
      values: [newProposalRid(), p.ontologyRid, p.actionType, JSON.stringify(p.parameters), JSON.stringify(p.edits), JSON.stringify(p.reads), p.proposedBy ?? null],
    });
    return toProposal(rows[0]);
  }

  async get(ontologyRid: string, rid: string): Promise<Proposal | undefined> {
    const { rows } = await this.pool.query<Row>({
      text: `SELECT * FROM action_proposals WHERE ontology_rid = $1 AND rid = $2`,
      values: [ontologyRid, rid],
    });
    return rows[0] ? toProposal(rows[0]) : undefined;
  }

  async list(ontologyRid: string, status?: ProposalStatus): Promise<Proposal[]> {
    const { rows } = await this.pool.query<Row>({
      text: `SELECT * FROM action_proposals WHERE ontology_rid = $1 AND ($2::text IS NULL OR status = $2) ORDER BY id`,
      values: [ontologyRid, status ?? null],
    });
    return rows.map(toProposal);
  }

  async decide(ontologyRid: string, rid: string, d: Decision): Promise<Proposal | undefined> {
    // Conditional on PENDING, so of two concurrent decisions only one lands.
    const { rows } = await this.pool.query<Row>({
      text: `UPDATE action_proposals
             SET status = $3, decided_by = $4, reason = $5, commit_id = $6, decided_at = NOW()
             WHERE ontology_rid = $1 AND rid = $2 AND status = 'PENDING'
             RETURNING *`,
      values: [ontologyRid, rid, d.status, d.decidedBy ?? null, d.reason ?? null, d.commitId ?? null],
    });
    return rows[0] ? toProposal(rows[0]) : undefined;
  }
}
