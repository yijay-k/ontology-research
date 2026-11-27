import { generateRid } from "@openfoundry/rid";

// ---------------------------------------------------------------------------
// Execution status & record
// ---------------------------------------------------------------------------

export type ExecutionStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export interface ActionExecution {
  /** Unique RID for this execution. */
  readonly rid: string;

  /** API name of the action that was executed. */
  readonly actionApiName: string;

  /** Parameters passed to the action. */
  readonly parameters: Record<string, unknown>;

  /** Current status. */
  status: ExecutionStatus;

  /** When the execution started. */
  readonly startedAt: string;

  /** When the execution completed (success or failure). */
  completedAt?: string;

  /** Result payload on success. */
  result?: Record<string, unknown>;

  /** Error message on failure. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Action log
// ---------------------------------------------------------------------------

/**
 * In-memory log of action executions.
 */
export class ActionLog {
  private readonly executions = new Map<string, ActionExecution>();

  /**
   * Log the start of an action execution.
   * Returns the new execution record with a generated RID.
   */
  logStart(actionApiName: string, parameters: Record<string, unknown>): ActionExecution {
    const rid = generateRid("actions", "execution").toString();
    const execution: ActionExecution = {
      rid,
      actionApiName,
      parameters,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
    };

    this.executions.set(rid, execution);

    return execution;
  }

  /**
   * Mark an execution as succeeded.
   */
  logComplete(rid: string, result?: Record<string, unknown>): void {
    const execution = this.executions.get(rid);
    if (!execution) return;
    execution.status = "SUCCEEDED";
    execution.completedAt = new Date().toISOString();
    execution.result = result;
  }

  /**
   * Mark an execution as failed.
   */
  logFailure(rid: string, error: string): void {
    const execution = this.executions.get(rid);
    if (!execution) return;
    execution.status = "FAILED";
    execution.completedAt = new Date().toISOString();
    execution.error = error;
  }

  /**
   * Retrieve an execution by its RID.
   */
  getExecution(rid: string): ActionExecution | undefined {
    return this.executions.get(rid);
  }
}

/**
 * The execution-log surface a route handler may depend on.
 *
 * Both the in-memory `ActionLog` and the Postgres-backed `PgActionLog` satisfy
 * it; every method may answer synchronously or with a promise, so a handler
 * that awaits it records the execution in either backend rather than leaving
 * the write floating.
 */
export interface ActionExecutionLog {
  logStart(
    actionApiName: string,
    parameters: Record<string, unknown>,
  ): ActionExecution | Promise<ActionExecution>;
  logComplete(rid: string, result?: Record<string, unknown>): void | Promise<void>;
  logFailure(rid: string, error: string): void | Promise<void>;
}
