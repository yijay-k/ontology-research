/** The edit history and revert endpoints over HTTP, on the in-memory store. */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.history";
let app: FastifyInstance;

beforeEach(async () => {
  const store = new ObjectStore(null);
  store.createObject(RID, "Invoice", "I1", { id: "I1", status: "open" });
  app = await createServer({ config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never, store, linkStore: new LinkStore(null) });
});

const commit = async (status: string) =>
  (await app.inject({
    method: "POST",
    url: `/internal/ontologies/${RID}/edits`,
    payload: { edits: [{ type: "modifyObject", objectType: "Invoice", primaryKey: "I1", properties: { status } }], actionType: "set-status", actor: "alice" },
  })).json().commitId as string;

describe("edit history and revert routes", () => {
  it("lists an object's commits and reverts one", async () => {
    const first = await commit("disputed");
    await commit("written-off");
    const history = (await app.inject({ method: "GET", url: `/api/v2/ontologies/${RID}/objects/Invoice/I1/editHistory` })).json().data;
    expect(history.map((h: { before: { status: string } }) => h.before.status)).toEqual(["open", "disputed"]);
    expect(history[0]).toMatchObject({ commitId: first, actionType: "set-status", actor: "alice", afterVersion: 2 });

    const latest = history[1].commitId;
    const reverted = await app.inject({ method: "POST", url: `/api/v2/ontologies/${RID}/commits/${latest}/revert` });
    expect(reverted.json()).toMatchObject({ revertOf: latest, replayed: false });
    const obj = await app.inject({ method: "GET", url: `/api/v2/ontologies/${RID}/objects/Invoice/I1` });
    expect(obj.json().properties?.status ?? obj.json().status).toBe("disputed");

    // Reverting the older commit now would overwrite the revert's own change.
    const stale = await app.inject({ method: "POST", url: `/api/v2/ontologies/${RID}/commits/${first}/revert` });
    expect(stale.statusCode).toBe(409);
  });

  it("answers 404 for an unknown commit", async () => {
    expect((await app.inject({ method: "POST", url: `/api/v2/ontologies/${RID}/commits/nope/revert` })).statusCode).toBe(404);
  });
});
