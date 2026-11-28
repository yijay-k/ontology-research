/**
 * Ontology Mind: a showcase chat that reasons visibly over a 3D ontology.
 * A question lights seed objects, sends particles along typed links hop by
 * hop, fires the logic that watches those objects, streams an answer and
 * proposes a governed action. Any node, in the graph or in an answer, can be
 * clicked to fly the camera in and open its details for that answer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/newsreader/opsz.css";
import "@fontsource-variable/newsreader/opsz-italic.css";
import { Synth } from "../lib/synth";
import Graph3D, { type Graph3DHandle, type NodeMark } from "./ontology-mind/Graph3D";
import {
  ADJ,
  DOMAINS,
  KIND_COLOR,
  KIND_LABEL,
  LINKS,
  LOGIC,
  NODES,
  OBJECTS,
  SCENARIOS,
  buildScenario,
  ekey,
  nodeColor,
  parseAnswer,
  propLabel,
  type Kind,
  type Scenario,
  type Seg,
  type TimelineEvent,
  type Tone,
} from "./ontology-mind/data";
import "./OntologyMind.css";

interface TraceStep {
  label: string;
  done: boolean;
}
interface BotMsg {
  id: number;
  role: "bot";
  segs: Seg[];
  total: number;
  shown: number;
  trace: TraceStep[];
  sc?: Scenario;
  stats?: { objects: number; links: number; logic: number };
  cards: boolean;
  action: "idle" | "applying" | "done";
  /** edits ticked off so far while an action cascades */
  applied?: number;
}
interface UserMsg {
  id: number;
  role: "user";
  text: string;
}
type Msg = BotMsg | UserMsg;

type Phase = "idle" | "parsing" | "traversing" | "reasoning" | "answering" | "acting";
const PHASE_LABEL: Record<Phase, string> = {
  idle: "Listening",
  parsing: "Parsing intent",
  traversing: "Traversing links",
  reasoning: "Evaluating logic",
  answering: "Composing answer",
  acting: "Committing action",
};

const GREETING = parseAnswer(
  `I hold ${OBJECTS.length} object types, ${LINKS.length} typed links and ${LOGIC.length} pieces of business logic. Submit a query to trace the reasoning across the graph, or select any node to inspect its definition and current state.`,
);
const TRAVERSE = "#f3e6c8";

export default function OntologyMind() {
  const [nodeState, setNodeState] = useState<Record<string, NodeMark>>({});
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("idle");
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [frame, setFrame] = useState<string[] | null>(null);
  const [activeSc, setActiveSc] = useState<Scenario | null>(null);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "bot", segs: GREETING, total: Infinity, shown: Infinity, trace: [], cards: false, action: "idle" },
  ]);

  const navigate = useNavigate();
  const synth = useMemo(() => new Synth(), []);
  const graph = useRef<Graph3DHandle>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(0);
  const msgId = useRef(1);
  const lastHoverSound = useRef(0);
  const stopDrone = useRef<() => void>(() => {});

  useEffect(() => {
    synth.muted = muted;
  }, [muted, synth]);
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopDrone.current();
    };
  }, []);

  const patchBot = (id: number, fn: (m: BotMsg) => BotMsg) =>
    setMessages((ms) => ms.map((m) => (m.id === id && m.role === "bot" ? fn(m) : m)));

  const select = useCallback(
    (id: string | null) => {
      setFocus(id);
      if (id) {
        synth.ping(5, 0.06);
        graph.current?.burst(id, 0.8);
      }
    },
    [synth],
  );

  const onHover = useCallback(
    (id: string | null) => {
      setHover(id);
      const now = performance.now();
      if (id && now - lastHoverSound.current > 70) {
        lastHoverSound.current = now;
        synth.hover();
      }
    },
    [synth],
  );

  /* ---------- the reasoning show ---------- */
  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    const sleep = (ms: number) => new Promise<boolean>((r) => setTimeout(() => r(alive()), ms));
    const g = () => graph.current;

    const sc = buildScenario(q);
    const segs = parseAnswer(sc.answer);
    const total = segs.reduce((n, s) => n + s.text.length, 0);
    const userId = msgId.current++;
    const botId = msgId.current++;
    const reached = sc.hops.reduce((n, h) => n + h.length, 0);
    const trace: TraceStep[] = [
      { label: `Parsed intent → ${sc.entities.length} entities`, done: false },
      { label: `Resolved ${sc.seeds.length} seed object type${sc.seeds.length > 1 ? "s" : ""}`, done: false },
      { label: `Traversed ${sc.hops.length} hops · ${reached} objects`, done: false },
      { label: `Evaluated ${sc.fire.length} rules, logic & indicators`, done: false },
      { label: sc.action ? "Drafted 1 governed action" : "Composed grounded answer", done: false },
    ];
    const step = (i: number) =>
      patchBot(botId, (m) => ({ ...m, trace: m.trace.map((t, j) => (j === i ? { ...t, done: true } : t)) }));

    setInput("");
    setFocus(null);
    setFrame(null);
    setActiveSc(sc);
    setMessages((ms) => [
      ...ms,
      { id: userId, role: "user", text: q },
      { id: botId, role: "bot", segs, total, shown: 0, trace, sc, cards: false, action: "idle" },
    ]);
    setNodeState({});
    setLit(new Set());
    synth.submit();
    stopDrone.current();
    stopDrone.current = synth.drone();

    setPhase("parsing");
    if (!(await sleep(700))) return;
    step(0);

    const active = new Set<string>();
    for (const [i, s] of sc.seeds.entries()) {
      setNodeState((st) => ({ ...st, [s]: "seed" }));
      g()?.burst(s, 1.8);
      g()?.burst(s, 1.1);
      synth.ping(8 + i, 0.12);
      active.add(s);
      if (!(await sleep(420))) return;
    }
    step(1);

    setPhase("traversing");
    let links = 0;
    for (const [h, hop] of sc.hops.entries()) {
      synth.whoosh(0.6 + h * 0.08);
      for (const [i, t] of hop.entries()) {
        const srcs = ADJ[t].filter((s) => active.has(s)).slice(0, 2);
        for (const s of srcs) {
          const k = ekey(s, t);
          g()?.fire(k, s, 700, TRAVERSE, 1.6);
          setLit((l) => new Set(l).add(k));
          links++;
        }
        setTimeout(() => {
          if (!alive()) return;
          setNodeState((st) => ({ ...st, [t]: "active" }));
          g()?.burst(t);
          synth.ping(h * 2 + i, 0.06);
        }, 680);
        if (!(await sleep(130))) return;
      }
      if (!(await sleep(720))) return;
      hop.forEach((t) => active.add(t));
    }
    step(2);

    setPhase("reasoning");
    for (const f of sc.fire) {
      setNodeState((st) => ({ ...st, [f]: "active" }));
      g()?.burst(f, 1.3);
      synth.blip();
      for (const t of ADJ[f].filter((x) => active.has(x))) {
        const k = ekey(f, t);
        g()?.fire(k, t, 600, KIND_COLOR[NODES[f].kind], 1.2);
        setLit((l) => new Set(l).add(k));
      }
      if (!(await sleep(360))) return;
    }
    step(3);

    setPhase("answering");
    stopDrone.current();
    synth.chord();
    for (let shown = 0; shown < total; shown += 3) {
      patchBot(botId, (m) => ({ ...m, shown }));
      if (shown % 12 === 0) synth.tick();
      if (!(await sleep(16))) return;
    }
    if (sc.action) {
      const a = sc.action.id;
      setNodeState((st) => ({ ...st, [a]: "active" }));
      g()?.burst(a, 1.6);
      synth.ping(10, 0.08);
    }
    patchBot(botId, (m) => ({ ...m, shown: total, cards: true, stats: { objects: active.size, links, logic: sc.fire.length } }));
    step(4);
    setPhase("idle");
  };

  /**
   * Applying an action cascades outward one node at a time: the action's own
   * targets first, then the objects linked to them, so the reach of one edit
   * plan is visible node by node.
   */
  const applyAction = async (msg: BotMsg) => {
    const a = msg.sc?.action;
    if (!a || msg.action !== "idle") return;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const g = () => graph.current;
    const rose = "#d9b8b0"; // action rose softened toward ivory
    patchBot(msg.id, (m) => ({ ...m, action: "applying", applied: 0 }));
    setPhase("acting");
    setFocus(null);
    synth.whoosh(0.5);
    g()?.burst(a.id, 1.4, rose);
    await wait(350);

    const wave1 = ADJ[a.id].filter((x) => NODES[x].kind === "object");
    const seen = new Set([a.id, ...wave1]);
    const wave2: [string, string][] = [];
    for (const p of wave1)
      for (const x of ADJ[p])
        if (!seen.has(x) && NODES[x].kind === "object" && wave2.length < 6) {
          seen.add(x);
          wave2.push([p, x]);
        }
    // linked objects already in the answer go first
    wave2.sort((l, r) => Number(!!nodeState[r[1]]) - Number(!!nodeState[l[1]]));
    // turn the camera so the whole cascade happens in view, and stay there afterwards
    setFrame([a.id, ...wave1, ...wave2.map(([, x]) => x)]);
    await wait(900);

    let note = 0;
    const touch = async (from: string, to: string, gap: number, size: number) => {
      const k = ekey(from, to);
      g()?.fire(k, from, 520, rose, size);
      setLit((l) => new Set(l).add(k));
      await wait(500);
      setNodeState((st) => ({ ...st, [to]: "applied" }));
      g()?.burst(to, 1.1, rose);
      synth.ping(4 + note++, 0.08);
      await wait(gap);
    };

    for (const [i, t] of wave1.entries()) {
      await touch(a.id, t, 260, 2);
      patchBot(msg.id, (m) => ({ ...m, applied: Math.min(a.edits.length, i + 1) }));
    }
    synth.success();
    g()?.shockwave(a.id);
    patchBot(msg.id, (m) => ({ ...m, applied: a.edits.length }));
    await wait(500);
    for (const [p, x] of wave2) await touch(p, x, 180, 1.4);

    patchBot(msg.id, (m) => ({ ...m, action: "done" }));
    setPhase("idle");
  };

  const counts = useMemo(() => {
    const c: Record<Kind, number> = { object: OBJECTS.length, logic: 0, rule: 0, indicator: 0, view: 0, action: 0 };
    LOGIC.forEach((l) => c[l.kind]++);
    return c;
  }, []);
  const busy = phase !== "idle";

  return (
    <div className={`om-root om-phase-${phase}`}>
      <div className="om-stage">
        <Graph3D
          ref={graph}
          nodeState={nodeState}
          lit={lit}
          hover={hover}
          focus={focus}
          frame={frame}
          busy={busy}
          onHover={onHover}
          onSelect={select}
        />

        <header className="om-hud om-hud-tl">
          <button className="om-back" onClick={() => navigate("/")} aria-label="Back to console">
            <svg viewBox="0 0 24 24" width="12" height="12">
              <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            OpenFoundry
          </button>
          <h1 className="om-title">Ontology Mind</h1>
          <div className="om-sub">
            Reasoning over typed objects, links and logic <span className="om-sep">·</span> FSI Factoring
          </div>
        </header>

        <aside className="om-hud om-hud-tr">
          <div className="om-legend-h">Ontology space</div>
          <div className="om-legend-row">
            <span className="om-dot" style={{ background: KIND_COLOR.object }} />
            Object<span className="om-legend-n">{counts.object}</span>
          </div>
          {Object.values(DOMAINS).map((d) => (
            <div key={d.label} className="om-legend-row om-legend-sub">
              <span className="om-dot" style={{ background: d.color }} />
              {d.label}
              <span className="om-legend-n">{d.ids.length}</span>
            </div>
          ))}
          {(Object.keys(KIND_COLOR) as Kind[])
            .filter((k) => k !== "object")
            .map((k) => (
              <div key={k} className="om-legend-row">
                <span className="om-dot" style={{ background: KIND_COLOR[k] }} />
                {KIND_LABEL[k]}
                <span className="om-legend-n">{counts[k]}</span>
              </div>
            ))}
          <div className="om-legend-row">
            <span className="om-dash" />
            Relation<span className="om-legend-n">{LINKS.length}</span>
          </div>
        </aside>

        <footer className="om-hud om-hud-bl">
          <span className="om-status-dot" />
          {PHASE_LABEL[phase]}
          <span className="om-hint">Drag to orbit · scroll to zoom · click a node</span>
          <button className="om-mute" onClick={() => setMuted((m) => !m)} aria-label="Toggle sound">
            {muted ? "Sound off" : "Sound on"}
          </button>
        </footer>

        {focus && (
          <DetailPanel
            key={focus}
            id={focus}
            sc={activeSc}
            nodeState={nodeState}
            onFocus={select}
            onHover={onHover}
            onClose={() => setFocus(null)}
          />
        )}
      </div>

      <aside className="om-chat">
        <div className="om-chat-h">
          <div className="om-chat-mark" />
          <div>
            <div className="om-chat-title">Ask the ontology</div>
            <div className="om-chat-sub">Graph-grounded · logic-aware · action-capable</div>
          </div>
        </div>

        <div className="om-msgs" ref={chatRef}>
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="om-msg om-user">
                {m.text}
              </div>
            ) : (
              <BotBubble key={m.id} m={m} onHover={onHover} onFocus={select} onApply={() => void applyAction(m)} />
            ),
          )}
        </div>

        <div className="om-suggest">
          <div className="om-sec">Suggested queries</div>
          {SCENARIOS.map((s) => (
            <button key={s.prompt} className="om-chip" onClick={() => void ask(s.prompt)}>
              {s.prompt}
            </button>
          ))}
        </div>

        <form
          className="om-input"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              synth.tick();
            }}
            placeholder="Ask about risk, cash, duplicates, overdue…"
            aria-label="Ask the ontology"
          />
          <button type="submit" disabled={!input.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M5 12 H19 M13 6 L19 12 L13 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail panel: what a node means, in the context of the answer      */
/* ------------------------------------------------------------------ */

interface Brief {
  title: string;
  subtitle?: string;
  status?: { label: string; tone: Tone };
  summary: string;
  figures: [string, string][];
  schema: string[];
  pointsTitle: string;
  points: string[];
  timelineTitle: string;
  timeline: TimelineEvent[];
  note?: string;
}

const KIND_HOW: Partial<Record<Kind, string>> = {
  rule: "Evaluated on every change to its inputs; a violation raises an early warning signal",
  indicator: "Recomputed whenever an input object changes",
  view: "Resolved at read time; no materialised copy is retained",
  logic: "Deterministic function over objects; returns a result and performs no writes",
};

/** Everything the zoomed-in card shows, scripted where the answer has it, derived otherwise. */
function brief(id: string, sc: Scenario | null, mark: NodeMark | undefined): Brief {
  const n = NODES[id];
  const d = sc?.details[id];
  const links = (ADJ[id] ?? []).filter((x) => NODES[x].kind === "object");
  const watchers = (ADJ[id] ?? []).filter((x) => NODES[x].kind !== "object");
  const markStatus = mark === "applied" ? { label: "Modified by action", tone: "info" as Tone } : mark === "seed" ? { label: "Query origin", tone: "warn" as Tone } : mark ? { label: "In scope", tone: "good" as Tone } : undefined;

  if (n.kind === "action") {
    const plan = sc?.action?.id === id ? sc.action : undefined;
    return {
      title: plan?.title ?? n.label,
      subtitle: "Governed action",
      status: mark === "active" ? { label: "Pending approval", tone: "warn" } : markStatus,
      summary: plan?.detail ?? n.desc,
      figures: plan ? [["edits", String(plan.edits.length)], ["mode", "all or nothing"]] : [],
      schema: [],
      pointsTitle: "Execution guarantees",
      points: [
        "Validated against the action type's permitted edits prior to commit",
        "All edits commit atomically, or none are applied",
        "Stale reads are retried against current state, up to five attempts",
        "Each change is recorded in the audit log",
      ],
      timelineTitle: plan ? "Edit plan" : "",
      timeline: plan ? plan.edits.map((e, k) => ({ at: `Step ${k + 1}`, label: e })) : [],
    };
  }
  if (n.kind !== "object") {
    return {
      title: n.label,
      subtitle: KIND_LABEL[n.kind],
      status: mark ? { label: "Triggered", tone: "warn" } : { label: "Monitoring", tone: "info" },
      summary: n.desc,
      figures: [["reads", String(links.length)]],
      schema: [],
      pointsTitle: "Evaluation logic",
      points: [`Inputs: ${links.map((x) => NODES[x].label).join(", ")}`, KIND_HOW[n.kind] ?? ""].filter(Boolean),
      timelineTitle: "",
      timeline: [],
    };
  }
  return {
    title: d?.title ?? n.label,
    subtitle: d ? n.label : "Object type",
    status: d?.status ?? markStatus,
    summary: d?.summary ?? n.desc,
    figures: d?.props ?? [["links", String(links.length)], ["watched by", String(watchers.length)]],
    schema: d ? [] : n.props,
    pointsTitle: "Observations",
    points: d?.points ?? [`Related to ${links.length} object type${links.length === 1 ? "" : "s"}`, `Governed by ${watchers.length} logic definition${watchers.length === 1 ? "" : "s"}`],
    timelineTitle: "Event history",
    timeline: d?.timeline ?? [],
    note: d?.note,
  };
}

function DetailPanel({
  id,
  sc,
  nodeState,
  onFocus,
  onHover,
  onClose,
}: {
  id: string;
  sc: Scenario | null;
  nodeState: Record<string, NodeMark>;
  onFocus: (id: string) => void;
  onHover: (id: string | null) => void;
  onClose: () => void;
}) {
  const n = NODES[id];
  const b = brief(id, sc, nodeState[id]);
  const neighbors = (ADJ[id] ?? []).filter((x) => NODES[x].kind === "object");
  const watchers = (ADJ[id] ?? []).filter((x) => NODES[x].kind !== "object");

  const Chip = ({ x }: { x: string }) => (
    <button
      className={`om-link ${nodeState[x] ? "on" : ""}`}
      style={{ color: nodeColor(x) }}
      onClick={() => onFocus(x)}
      onMouseEnter={() => onHover(x)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="om-link-dot" />
      <span className="om-link-t">{NODES[x].label}</span>
    </button>
  );

  return (
    <section className="om-detail" style={{ ["--k" as string]: nodeColor(id) }}>
      <div className="om-detail-top">
        <span className="om-kicker">{KIND_LABEL[n.kind]}</span>
        <button className="om-x" onClick={onClose} aria-label="Close detail">
          Esc
        </button>
      </div>

      <h2 className="om-detail-title">{b.title}</h2>
      <div className="om-detail-meta">
        {b.subtitle && <span className="om-detail-type">{b.subtitle}</span>}
        {b.status && <span className={`om-status ${b.status.tone}`}>{b.status.label}</span>}
      </div>
      <p className="om-detail-summary">{b.summary}</p>

      {b.figures.length > 0 && (
        <div className="om-figs">
          {b.figures.map(([k, v], i) => (
            <div key={k} className="om-fig" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
              <div className="om-fig-v">{v}</div>
              <div className="om-fig-l">{propLabel(k)}</div>
            </div>
          ))}
        </div>
      )}

      {b.schema.length > 0 && (
        <div className="om-block">
          <div className="om-sec">Properties</div>
          <div className="om-schema">
            {b.schema.map((p) => (
              <code key={p}>{propLabel(p)}</code>
            ))}
          </div>
        </div>
      )}

      {b.points.length > 0 && (
        <div className="om-block">
          <div className="om-sec">{b.pointsTitle}</div>
          <ul className="om-points">
            {b.points.map((p, i) => (
              <li key={p} style={{ animationDelay: `${0.25 + i * 0.06}s` }}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {b.timeline.length > 0 && (
        <div className="om-block">
          <div className="om-sec">{b.timelineTitle}</div>
          <ol className="om-timeline">
            {b.timeline.map((e, i) => (
              <li key={i} className={e.tone ?? ""} style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                <span className="om-tl-at">{e.at}</span>
                <span className="om-tl-label">{e.label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {b.note && (
        <div className="om-note">
          <div className="om-note-h">Assessment</div>
          {b.note}
        </div>
      )}

      {neighbors.length > 0 && (
        <div className="om-block">
          <div className="om-sec">Related object types · {neighbors.length}</div>
          <div className="om-links">
            {neighbors.map((x) => (
              <Chip key={x} x={x} />
            ))}
          </div>
        </div>
      )}
      {watchers.length > 0 && (
        <div className="om-block">
          <div className="om-sec">{n.kind === "object" ? "Governing logic" : "Scope"}</div>
          <div className="om-links">
            {watchers.map((x) => (
              <Chip key={x} x={x} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Assistant bubble                                                   */
/* ------------------------------------------------------------------ */

function BotBubble({
  m,
  onHover,
  onFocus,
  onApply,
}: {
  m: BotMsg;
  onHover: (id: string | null) => void;
  onFocus: (id: string) => void;
  onApply: () => void;
}) {
  let budget = m.shown;
  const streaming = m.shown < m.total;
  const doneSteps = m.trace.filter((t) => t.done).length;
  const explore = m.sc ? Object.keys(m.sc.details) : [];

  return (
    <div className="om-msg om-bot">
      {m.trace.length > 0 && (
        <div className="om-trace">
          {m.trace.map((t, i) => (
            <div key={i} className={`om-trace-row ${t.done ? "done" : i === doneSteps ? "run" : ""}`}>
              <span className="om-trace-ic">{t.done ? "✓" : ""}</span>
              {t.label}
            </div>
          ))}
          {m.sc && (
            <div className="om-entities">
              {m.sc.entities.map((e) => (
                <span key={e} className="om-entity">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {m.shown > 0 && (
        <p className="om-answer">
          {m.segs.map((s, i) => {
            if (budget <= 0) return null;
            const text = s.text.slice(0, budget);
            budget -= s.text.length;
            if (!s.ref) return <span key={i}>{text}</span>;
            const ref = s.ref;
            return (
              <button
                key={i}
                className="om-ref"
                style={{ color: nodeColor(ref) }}
                onMouseEnter={() => onHover(ref)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onFocus(ref)}
              >
                {text}
              </button>
            );
          })}
          {streaming && <span className="om-caret" />}
        </p>
      )}

      {m.cards && m.sc && (
        <div className="om-cards">
          <div className="om-metrics">
            {m.sc.metrics.map((x, i) => (
              <div key={x.label} className={`om-metric ${x.tone}`} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="om-metric-v">{x.value}</div>
                <div className="om-metric-l">{x.label}</div>
              </div>
            ))}
          </div>

          {explore.length > 0 && (
            <div className="om-explore">
              <div className="om-sec">Inspect entities</div>
              <div className="om-links">
                {explore.map((x) => (
                  <button
                    key={x}
                    className="om-link on"
                    style={{ color: nodeColor(x) }}
                    onClick={() => onFocus(x)}
                    onMouseEnter={() => onHover(x)}
                    onMouseLeave={() => onHover(null)}
                  >
                    <span className="om-link-dot" />
                    <span className="om-link-t">{m.sc!.details[x].title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {m.stats && (
            <div className="om-vs">
              <div className="om-vs-row rag">
                <span className="om-vs-name">Vector RAG</span>
                <span className="om-vs-bar">
                  <i style={{ width: "18%" }} />
                </span>
                <span className="om-vs-meta">{m.sc.rag.chunks} chunks · 0 joins · can't act</span>
              </div>
              <div className="om-vs-quote">{m.sc.rag.answer}</div>
              <div className="om-vs-row onto">
                <span className="om-vs-name">Ontology</span>
                <span className="om-vs-bar">
                  <i style={{ width: "100%" }} />
                </span>
                <span className="om-vs-meta">
                  {m.stats.objects} objects · {m.stats.links} links · {m.stats.logic} logic
                  {m.sc.action ? " · 1 action" : ""}
                </span>
              </div>
            </div>
          )}

          {m.sc.action && (
            <div className={`om-action ${m.action}`}>
              <div className="om-kicker">{m.action === "done" ? "Committed" : "Governed action"}</div>
              <div className="om-action-h">{m.sc.action.title}</div>
              <div className="om-action-d">{m.sc.action.detail}</div>
              <ul className="om-edits">
                {m.sc.action.edits.map((e) => (
                  <li key={e}>
                    <span>{m.action === "done" || m.sc!.action!.edits.indexOf(e) < (m.applied ?? 0) ? "✓" : "○"}</span>
                    {e}
                  </li>
                ))}
              </ul>
              {m.action === "done" ? (
                <div className="om-action-ok">Committed atomically · audit record written</div>
              ) : (
                <button className="om-apply" onClick={onApply} disabled={m.action === "applying"}>
                  {m.action === "applying" ? "Applying edit plan…" : "Apply action"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
