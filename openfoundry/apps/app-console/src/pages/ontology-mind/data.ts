/**
 * Graph + scripted scenarios for the Ontology Mind showcase.
 *
 * ponytail: answers are scripted demo data, not calls to svc-ontology or AIP.
 * Wire `buildScenario` to the real graph + an LLM once the demo story is set.
 */

export type Kind = "object" | "logic" | "rule" | "indicator" | "view" | "action";

/** Desaturated, warm palette: one champagne primary, muted kind accents. */
export const KIND_COLOR: Record<Kind, string> = {
  object: "#d8c6a1",
  logic: "#93b5a1",
  rule: "#8ea5c4",
  indicator: "#cf9a7c",
  view: "#b3a6cf",
  action: "#d0919f",
};
export const KIND_LABEL: Record<Kind, string> = {
  object: "Object",
  logic: "Logic",
  rule: "Rule",
  indicator: "Indicator",
  view: "Analysis View",
  action: "Action",
};

/** Objects are tinted by business domain: five muted tones from one warm family. */
export const DOMAINS = {
  parties: { label: "Parties", color: "#e3d5b8", ids: ["seller", "buyer", "account", "limit"] },
  receivables: { label: "Receivables", color: "#d2ac7f", ids: ["invoice", "line", "dispute", "receipt"] },
  cash: { label: "Cash", color: "#bdb6a8", ids: ["collection", "remit", "paymsg", "credit", "posted", "settle"] },
  financing: { label: "Financing", color: "#c4a59c", ids: ["facility", "disb", "alloc", "repay", "instal"] },
  risk: { label: "Risk & case", color: "#a39380", ids: ["riskcase", "evidence", "ews", "review", "contact", "audit", "report"] },
};

/** id, label, description, key properties */
export const OBJECTS: [string, string, string, string[]][] = [
  ["report", "Report artifact", "Generated credit or audit report filed against a facility.", ["reportId", "type", "generatedAt", "facilityId"]],
  ["audit", "Case audit", "Immutable trail entry recording why a case changed.", ["auditId", "caseId", "actor", "reason", "at"]],
  ["review", "Review task", "Work item assigned to an analyst or collector.", ["taskId", "owner", "due", "priority", "status"]],
  ["contact", "Contact note", "Logged conversation with a buyer or seller.", ["noteId", "party", "channel", "summary", "at"]],
  ["riskcase", "Risk case", "Open investigation into a client, buyer or invoice.", ["caseId", "stage", "severity", "openedAt", "owner"]],
  ["evidence", "Case evidence", "Document or object attached to a risk case.", ["evidenceId", "caseId", "kind", "ref"]],
  ["ews", "Early warning signal", "Behavioural signal that a party is deteriorating.", ["signalId", "party", "metric", "delta", "firedAt"]],
  ["seller", "Seller client", "Business that sells its receivables to us.", ["sellerId", "name", "segment", "rating", "since"]],
  ["buyer", "Buyer obligor", "Debtor who owes payment on funded invoices.", ["buyerId", "name", "rating", "terms", "exposure"]],
  ["account", "Account", "Settlement account held for a seller.", ["accountId", "sellerId", "currency", "balance"]],
  ["limit", "Concentration limit", "Maximum share of a facility one buyer may represent.", ["limitId", "buyerId", "cap", "current"]],
  ["invoice", "Invoice", "Receivable purchased from a seller, owed by a buyer.", ["invoiceId", "amount", "issued", "due", "status"]],
  ["line", "Invoice line", "Individual billed item on an invoice.", ["lineId", "sku", "qty", "unitPrice"]],
  ["dispute", "Dilution dispute", "Buyer claim reducing what an invoice will pay.", ["disputeId", "invoiceId", "reason", "amount"]],
  ["receipt", "Receipt verification", "Buyer confirmation that goods were received.", ["verificationId", "invoiceId", "status", "at"]],
  ["collection", "Collection", "Expected or received payment against invoices.", ["collectionId", "expected", "received", "ageDays"]],
  ["remit", "Remittance advice", "Buyer note mapping a payment to invoices.", ["adviceId", "payer", "refs", "amount"]],
  ["paymsg", "Payment message", "Bank-side payment instruction (MT103 / pacs.008).", ["msgId", "payer", "amount", "valueDate"]],
  ["credit", "Bank credit", "Cash that landed in a collection account.", ["creditId", "amount", "valueDate", "matched"]],
  ["posted", "Posted credit", "Credit applied to the ledger against invoices.", ["postingId", "creditId", "invoiceIds", "at"]],
  ["settle", "Settlement", "Release of reserves back to the seller.", ["settlementId", "sellerId", "amount", "at"]],
  ["facility", "Facility", "Credit line funding a seller's receivables.", ["facilityId", "limit", "drawn", "utilisation", "status"]],
  ["disb", "Disbursement", "Funds advanced to a seller under a facility.", ["disbId", "facilityId", "amount", "at"]],
  ["alloc", "Financing allocation", "Which invoices back which disbursement.", ["allocId", "disbId", "invoiceId", "advanceRate"]],
  ["repay", "Repayment", "Cash returned against a disbursement.", ["repayId", "disbId", "amount", "at"]],
  ["instal", "Loan instalment", "Scheduled repayment slice on a facility.", ["instalId", "facilityId", "due", "amount", "status"]],
];

export const LINKS: [string, string][] = [
  ["seller", "account"], ["seller", "facility"], ["seller", "invoice"], ["buyer", "invoice"],
  ["buyer", "limit"], ["invoice", "line"], ["invoice", "collection"], ["invoice", "alloc"],
  ["invoice", "dispute"], ["invoice", "receipt"], ["collection", "remit"], ["remit", "paymsg"],
  ["paymsg", "credit"], ["credit", "posted"], ["credit", "settle"], ["settle", "invoice"],
  ["posted", "account"], ["facility", "disb"], ["facility", "limit"], ["disb", "alloc"],
  ["alloc", "repay"], ["repay", "instal"], ["instal", "facility"], ["buyer", "ews"],
  ["seller", "ews"], ["ews", "riskcase"], ["riskcase", "review"], ["riskcase", "evidence"],
  ["riskcase", "audit"], ["review", "contact"], ["contact", "buyer"], ["evidence", "invoice"],
  ["audit", "report"], ["report", "facility"], ["receipt", "buyer"], ["dispute", "evidence"],
  ["limit", "riskcase"], ["collection", "contact"], ["account", "disb"], ["settle", "repay"],
];

export interface LogicItem {
  id: string;
  label: string;
  kind: Exclude<Kind, "object">;
  targets: string[];
  desc: string;
}

export const LOGIC: LogicItem[] = [
  { id: "s360", label: "Seller 360", kind: "view", targets: ["seller", "account", "facility"], desc: "One view of a seller's facility, accounts and performance." },
  { id: "bexp", label: "Buyer exposure", kind: "view", targets: ["buyer", "limit"], desc: "Exposure to a buyer across every seller that sells to them." },
  { id: "conc", label: "Concentration ≤ 25%", kind: "rule", targets: ["buyer", "limit", "facility"], desc: "No single buyer may exceed 25% of a facility's funded book." },
  { id: "over", label: "Overdue > 60d", kind: "rule", targets: ["invoice", "instal", "collection"], desc: "Flags receivables and instalments more than 60 days late." },
  { id: "dup", label: "Duplicate invoice", kind: "rule", targets: ["invoice", "line", "seller"], desc: "Same seller, buyer, PO and near-identical lines within 30 days." },
  { id: "dil", label: "Dilution calculator", kind: "logic", targets: ["invoice", "dispute"], desc: "Computes value lost to credit notes and disputes." },
  { id: "match", label: "Cash matcher", kind: "logic", targets: ["credit", "remit", "invoice"], desc: "Fuzzy-matches bank credits to invoices via remittance refs." },
  { id: "age", label: "Ageing bucketer", kind: "logic", targets: ["invoice", "collection"], desc: "Buckets receivables into 0-30 / 31-60 / 61-90 / 90+ days." },
  { id: "dso", label: "DSO", kind: "indicator", targets: ["invoice", "collection"], desc: "Days sales outstanding, rolling 90 days." },
  { id: "exp", label: "Exposure", kind: "indicator", targets: ["facility", "buyer", "alloc"], desc: "Funded amount at risk per party." },
  { id: "mr", label: "Match rate", kind: "indicator", targets: ["credit", "posted"], desc: "Share of credits auto-matched within one business day." },
  { id: "dr", label: "Dilution rate", kind: "indicator", targets: ["dispute", "seller"], desc: "Dilution as a share of funded invoices." },
  { id: "open", label: "Open risk case", kind: "action", targets: ["riskcase", "evidence"], desc: "Opens a case and attaches evidence in one edit plan." },
  { id: "freeze", label: "Freeze drawdown", kind: "action", targets: ["facility", "disb"], desc: "Blocks new disbursements on a facility." },
  { id: "verify", label: "Request verification", kind: "action", targets: ["receipt", "buyer"], desc: "Asks a buyer to confirm receipt before posting." },
  { id: "assign", label: "Assign collector", kind: "action", targets: ["review", "contact"], desc: "Routes a buyer to a named collector with a due date." },
];

export interface GNode {
  id: string;
  label: string;
  kind: Kind;
  desc: string;
  props: string[];
  index: number;
}

export const NODES: Record<string, GNode> = {};
OBJECTS.forEach(([id, label, desc, props], index) => {
  NODES[id] = { id, label, kind: "object", desc, props, index };
});
LOGIC.forEach((l, index) => {
  NODES[l.id] = { id: l.id, label: l.label, kind: l.kind, desc: l.desc, props: [], index };
});

const DOMAIN_OF: Record<string, string> = {};
for (const d of Object.values(DOMAINS)) for (const id of d.ids) DOMAIN_OF[id] = d.color;
/** Colour for one node: its domain tone for objects, its kind tone for logic. */
export const nodeColor = (id: string) => DOMAIN_OF[id] ?? KIND_COLOR[NODES[id]?.kind ?? "object"];

export const ekey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export interface GEdge {
  key: string;
  a: string;
  b: string;
  kind: Kind;
}
export const EDGES: GEdge[] = [
  ...LINKS.map(([a, b]) => ({ key: ekey(a, b), a, b, kind: "object" as Kind })),
  ...LOGIC.flatMap((l) => l.targets.map((t) => ({ key: ekey(l.id, t), a: l.id, b: t, kind: l.kind as Kind }))),
];
export const ADJ: Record<string, string[]> = {};
for (const e of EDGES) {
  (ADJ[e.a] ??= []).push(e.b);
  (ADJ[e.b] ??= []).push(e.a);
}

/* ------------------------------------------------------------------ */
/*  Scenarios                                                          */
/* ------------------------------------------------------------------ */

export interface Metric {
  label: string;
  value: string;
  tone: "bad" | "warn" | "good" | "info";
}
/** What the zoomed-in panel shows for a node, in the context of one answer. */
export type Tone = "bad" | "warn" | "good" | "info";
export interface TimelineEvent {
  at: string;
  label: string;
  tone?: Tone;
}
export interface NodeDetail {
  title: string;
  props: [string, string][];
  note: string;
  status?: { label: string; tone: Tone };
  summary?: string;
  points?: string[];
  timeline?: TimelineEvent[];
}
export interface Scenario {
  prompt: string;
  match: string[];
  entities: string[];
  seeds: string[];
  hops: string[][];
  fire: string[];
  answer: string;
  metrics: Metric[];
  action?: { id: string; title: string; detail: string; edits: string[] };
  rag: { chunks: number; answer: string };
  details: Record<string, NodeDetail>;
}

export const SCENARIOS: Scenario[] = [
  {
    prompt: "Why is Kestrel's facility flagged as high risk?",
    match: ["risk", "flag", "facility", "exposure", "kestrel", "concentration"],
    entities: ["Seller · Kestrel Components", "Facility", "intent · explain risk"],
    seeds: ["seller"],
    hops: [["facility", "invoice", "account"], ["buyer", "limit", "disb"], ["ews", "riskcase"]],
    fire: ["s360", "bexp", "conc", "exp"],
    answer:
      "Kestrel Components' [[facility|FAC-0042]] is at 91% utilisation, and 38% of its funded [[invoice|invoices]] sit with a single debtor, [[buyer|Halden Retail]]. That breaches the [[limit|25% concentration limit]] by 13 points. An [[ews|early warning signal]] on Halden (payment days up from 41 to 67) has already opened [[riskcase|RC-1187]]. Recommendation: freeze new [[disb|drawdowns]] on FAC-0042 until Halden exposure is back under the cap.",
    metrics: [
      { label: "Utilisation", value: "91%", tone: "warn" },
      { label: "Halden share", value: "38%", tone: "bad" },
      { label: "Cap", value: "25%", tone: "info" },
      { label: "Halden DSO", value: "67d", tone: "bad" },
    ],
    action: {
      id: "freeze",
      title: "Freeze drawdown · FAC-0042",
      detail: "Blocks new disbursements until concentration < 25%. Governed by Credit Ops.",
      edits: ["modifyObject Facility FAC-0042 · status → FROZEN", "addObject Case audit · reason = CONCENTRATION", "modifyObject Risk case RC-1187 · stage → MITIGATING"],
    },
    rag: { chunks: 4, answer: "“The credit policy states concentration above 25% is considered elevated risk…” (policy.pdf, p.12)" },
    details: {
      seller: { title: "Kestrel Components Ltd", props: [["sellerId", "SEL-0193"], ["segment", "Industrial parts"], ["rating", "BB+"], ["since", "2021-04"]], note: "Origin of the query. Standalone credit quality is adequate; the exposure arises from obligor concentration in its receivables." },
      facility: { title: "FAC-0042", props: [["limit", "€4.0M"], ["drawn", "€3.64M"], ["utilisation", "91%"], ["status", "ACTIVE"]], note: "Utilisation is approaching the facility limit while collateral is concentrated in a single obligor." },
      buyer: { title: "Halden Retail plc", props: [["rating", "BB- (↓ from BB)"], ["terms", "Net 45"], ["exposure", "€1.38M"], ["DSO", "67d"]], note: "Accounts for 38% of the funded portfolio; average days-to-pay has lengthened by 26 days quarter on quarter." },
      limit: { title: "LIM-Halden-0042", props: [["cap", "25%"], ["current", "38%"], ["breach", "+13 pts"], ["since", "2026-11-19"]], note: "Limit breached nine days ago. The rule triggered, but no remediation has been recorded." },
      ews: { title: "EWS-7731 · payment days", props: [["metric", "Avg days to pay"], ["delta", "41 → 67"], ["window", "90 days"], ["firedAt", "2026-11-21"]], note: "Behavioural indicator that initiated the risk case." },
      riskcase: { title: "RC-1187", props: [["stage", "TRIAGE"], ["severity", "High"], ["owner", "credit-ops"], ["openedAt", "2026-11-21"]], note: "Case remains open with no mitigation recorded. The proposed action transitions it to MITIGATING." },
      invoice: { title: "38 funded invoices · Halden", props: [["value", "€1.38M"], ["avg age", "52d"], ["overdue", "11"], ["disputed", "2"]], note: "Collateral is concentrated in a single obligor." },
      disb: { title: "Next drawdown request", props: [["amount", "€220k"], ["requested", "2026-11-27"], ["status", "PENDING"]], note: "Approval would raise utilisation to 96%. The proposed action suspends further drawdowns." },
    },
  },
  {
    prompt: "Which bank credits this week are unmatched to invoices?",
    match: ["match", "unmatched", "cash", "payment", "bank", "remittance", "reconcile", "credit"],
    entities: ["Bank credit", "Invoice", "window · this week", "intent · reconcile"],
    seeds: ["credit"],
    hops: [["paymsg", "posted", "settle"], ["remit", "account", "invoice"], ["collection", "receipt", "buyer"]],
    fire: ["match", "mr", "age"],
    answer:
      "14 [[credit|bank credits]] (€412k) landed this week with no matched [[invoice|invoice]]. 9 resolve on their own: their [[remit|remittance advices]] quote invoice numbers with a transposed prefix, and the [[paymsg|payment messages]] carry the right amounts. The other 5 all come from [[buyer|Halden Retail]] and have no [[receipt|receipt verification]] on file, so they can't be [[posted|posted]] safely. Match rate is down to 82% from 97%.",
    metrics: [
      { label: "Unmatched", value: "14", tone: "warn" },
      { label: "Value", value: "€412k", tone: "info" },
      { label: "Auto-resolvable", value: "9", tone: "good" },
      { label: "Match rate", value: "82%", tone: "bad" },
    ],
    action: {
      id: "verify",
      title: "Request receipt verification · Halden Retail",
      detail: "Sends a verification request for 5 credits and holds posting until confirmed.",
      edits: ["addObject Receipt verification ×5", "modifyObject Bank credit ×9 · matched → TRUE", "addObject Contact note · channel = AP portal"],
    },
    rag: { chunks: 6, answer: "“Unmatched receipts should be investigated within 2 business days…” (ops-handbook.md)" },
    details: {
      credit: { title: "14 unmatched credits", props: [["value", "€412k"], ["oldest", "2026-11-24"], ["auto-fixable", "9"], ["blocked", "5"]], note: "Origin of the query. Funds have settled but remain unapplied to receivables." },
      remit: { title: "9 advices · prefix transposed", props: [["pattern", "INV-2093 ↔ IVN-2093"], ["confidence", "0.97"], ["payer", "mixed"]], note: "The matching logic resolves these once the transposed reference prefix is tolerated." },
      paymsg: { title: "pacs.008 batch 1124", props: [["messages", "14"], ["amounts match", "14 / 14"], ["valueDate", "2026-11-25"]], note: "Amounts reconcile; the discrepancy is confined to remittance references." },
      buyer: { title: "Halden Retail plc", props: [["unmatched", "5 credits"], ["value", "€168k"], ["verifications", "0 on file"]], note: "The same obligor is subject to the concentration breach; the two exceptions are correlated." },
      receipt: { title: "Missing verifications", props: [["required", "5"], ["on file", "0"], ["policy", "verify > €25k"]], note: "Posting without verification would contravene the operations policy." },
      posted: { title: "Posting queue", props: [["held", "14"], ["releasable now", "9"]], note: "Nine postings become eligible for release upon execution of the action." },
      invoice: { title: "Open Halden invoices", props: [["count", "23"], ["value", "€611k"]], note: "Probable allocation targets for the five unapplied credits." },
    },
  },
  {
    prompt: "Are there any duplicate invoices I should worry about?",
    match: ["duplicate", "fraud", "double", "suspicious", "same invoice"],
    entities: ["Invoice", "pattern · duplicate", "intent · detect"],
    seeds: ["invoice"],
    hops: [["line", "seller", "buyer"], ["evidence", "receipt", "dispute"], ["riskcase"]],
    fire: ["dup", "dil", "dr"],
    answer:
      "Yes, one pair. [[invoice|INV-20931]] and INV-20947 from [[seller|Kestrel Components]] share 11 of 12 [[line|invoice lines]], the same PO, and amounts within 0.4%, billed 6 days apart to [[buyer|Halden Retail]]. Neither has a [[receipt|receipt verification]], and Kestrel's dilution rate has doubled to 4.1% on [[dispute|disputed]] items. That's the duplicate pattern, not a coincidence. I've staged both as [[evidence|case evidence]].",
    metrics: [
      { label: "Line overlap", value: "11/12", tone: "bad" },
      { label: "Amount Δ", value: "0.4%", tone: "bad" },
      { label: "Dilution", value: "4.1%", tone: "warn" },
      { label: "At risk", value: "€186k", tone: "info" },
    ],
    action: {
      id: "open",
      title: "Open risk case · duplicate billing",
      detail: "Creates a case with both invoices attached and pauses funding on INV-20947.",
      edits: ["addObject Risk case RC-1192", "addObject Case evidence ×2", "modifyObject Invoice INV-20947 · fundable → FALSE"],
    },
    rag: { chunks: 3, answer: "“Duplicate invoices are a known fraud vector in receivables finance…” (fraud-primer.pdf)" },
    details: {
      invoice: { title: "INV-20931 ⇄ INV-20947", props: [["amounts", "€93.1k / €92.7k"], ["PO", "PO-55810 (both)"], ["issued", "11-14 / 11-20"], ["funded", "yes / pending"]], note: "Origin of the query. Two invoices represent a single underlying shipment." },
      line: { title: "Line overlap", props: [["shared", "11 of 12"], ["differs", "freight line only"]], note: "The sole variance is a freight charge." },
      seller: { title: "Kestrel Components Ltd", props: [["dilution", "4.1% (was 2.0%)"], ["prior dups", "0"]], note: "No prior occurrence on record. The cause may be clerical rather than fraudulent; funding should be suspended in either case." },
      dispute: { title: "Open disputes", props: [["count", "3"], ["value", "€38k"], ["reason", "short delivery"]], note: "Dilution is increasing for the same seller." },
      receipt: { title: "Verification gap", props: [["INV-20931", "none"], ["INV-20947", "none"]], note: "Neither invoice has been confirmed by the obligor." },
      evidence: { title: "Staged evidence", props: [["items", "2 invoices + line diff"]], note: "Staged for attachment upon case creation." },
    },
  },
  {
    prompt: "What's overdue and who should we chase first?",
    match: ["overdue", "collect", "late", "ageing", "aging", "dso", "chase"],
    entities: ["Collection", "Invoice", "intent · prioritise"],
    seeds: ["collection"],
    hops: [["invoice", "remit", "contact"], ["buyer", "review", "alloc"], ["repay", "disb"], ["instal", "facility"]],
    fire: ["age", "over", "dso"],
    answer:
      "€1.8M is overdue across 63 [[invoice|invoices]], and 71% of it is past 60 days with three buyers. [[buyer|Halden Retail]] alone is €740k, and the last [[contact|contact note]] says their AP is “on hold pending audit”. Two [[instal|loan instalments]] on [[facility|FAC-0042]] depend on those collections landing. DSO is 58 days, up 9 on last quarter. Chase Halden first, with a senior collector on a [[review|review task]] today.",
    metrics: [
      { label: "Overdue", value: "€1.8M", tone: "bad" },
      { label: ">60 days", value: "71%", tone: "bad" },
      { label: "Halden", value: "€740k", tone: "warn" },
      { label: "DSO", value: "58d", tone: "warn" },
    ],
    action: {
      id: "assign",
      title: "Assign senior collector · Halden Retail",
      detail: "Creates a review task due today and links the AP hold note.",
      edits: ["addObject Review task · owner = senior-collections", "modifyObject Collection ×12 · priority → P1"],
    },
    rag: { chunks: 5, answer: "“Accounts past 60 days should be escalated per the collections SOP…” (collections-sop.docx)" },
    details: {
      collection: { title: "Overdue book", props: [["value", "€1.8M"], ["invoices", "63"], [">60d", "71%"], ["buyers", "3 hold 80%"]], note: "Origin of the query." },
      buyer: { title: "Halden Retail plc", props: [["overdue", "€740k"], ["oldest", "94d"], ["promise-to-pay", "none"]], note: "Largest and most aged balance, with no promise to pay on record." },
      contact: { title: "Note · 2026-11-22", props: [["channel", "phone"], ["with", "Halden AP"], ["summary", "“on hold pending audit”"]], note: "Documents the cause of the payment suspension; no follow-up action was recorded." },
      instal: { title: "Instalments at risk", props: [["count", "2"], ["due", "12-05, 12-19"], ["value", "€410k"]], note: "Facility repayments contingent on collections from Halden." },
      facility: { title: "FAC-0042", props: [["utilisation", "91%"], ["headroom", "€360k"]], note: "A shortfall in these collections would further constrain available headroom." },
      review: { title: "Proposed task", props: [["owner", "senior-collections"], ["due", "today"], ["priority", "P1"]], note: "Record to be created by the proposed action." },
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Briefing extras: status, summary, findings and timeline per node   */
/* ------------------------------------------------------------------ */

type Extra = Pick<NodeDetail, "status" | "summary" | "points" | "timeline">;
const EXTRAS: Record<number, Record<string, Extra>> = {
  0: {
    seller: {
      status: { label: "Under watch", tone: "warn" },
      summary: "Creditworthy on a standalone basis; materially exposed through its largest obligor.",
      points: ["Rated BB+, stable for 18 months", "38% of funded book sits with one buyer", "No missed settlements this year"],
      timeline: [
        { at: "2021-04", label: "Onboarded, facility FAC-0042 opened" },
        { at: "2026-08", label: "Halden share passes 25%", tone: "warn" },
        { at: "2026-11-21", label: "Risk case RC-1187 opened", tone: "bad" },
      ],
    },
    facility: {
      status: { label: "Approaching limit", tone: "warn" },
      summary: "€3.64M drawn against a €4.0M limit, with collateral concentrated in a single obligor.",
      points: ["Utilisation 91%, up from 74% in Q3", "€220k drawdown pending would take it to 96%", "Collateral quality falling with Halden's rating"],
      timeline: [
        { at: "2026-07", label: "Utilisation 74%" },
        { at: "2026-10", label: "Utilisation 86%", tone: "warn" },
        { at: "2026-11-27", label: "€220k drawdown requested", tone: "warn" },
        { at: "Proposed", label: "Freeze new drawdowns", tone: "info" },
      ],
    },
    buyer: {
      status: { label: "Deteriorating", tone: "bad" },
      summary: "Payment performance has deteriorated by 26 days quarter on quarter, accompanied by a one-notch downgrade.",
      points: ["Holds €1.38M of exposure across the facility", "DSO 67 days on Net 45 terms", "Rating cut BB → BB- on 2026-10-30"],
      timeline: [
        { at: "2026-08", label: "Average days to pay: 41" },
        { at: "2026-10-30", label: "Downgraded to BB-", tone: "bad" },
        { at: "2026-11-21", label: "Early warning signal triggered", tone: "bad" },
      ],
    },
    limit: {
      status: { label: "Limit breached", tone: "bad" },
      summary: "Concentration exceeds the 25% limit by 13 percentage points.",
      points: ["Cap 25% of funded book per buyer", "Current 38%", "Breach unremediated for nine days"],
      timeline: [
        { at: "2026-11-19", label: "Rule triggered: 27% > 25%", tone: "bad" },
        { at: "2026-11-28", label: "Now 38%", tone: "bad" },
      ],
    },
    ews: {
      status: { label: "Triggered", tone: "bad" },
      summary: "Material deterioration in payment behaviour over the trailing 90 days.",
      points: ["Days to pay 41 → 67", "Signal threshold is +15 days", "Opened RC-1187 automatically"],
    },
    riskcase: {
      status: { label: "In triage", tone: "warn" },
      summary: "Open for seven days without a recorded mitigation.",
      points: ["Severity High, owner credit-ops", "No actions recorded since opening", "The proposed action transitions it to MITIGATING"],
      timeline: [
        { at: "2026-11-21", label: "Opened by early warning signal" },
        { at: "2026-11-24", label: "Assigned to credit-ops" },
        { at: "Proposed", label: "Stage → MITIGATING", tone: "info" },
      ],
    },
  },
  1: {
    credit: {
      status: { label: "Unreconciled", tone: "warn" },
      summary: "€412k of settled funds remain unapplied to the receivables ledger.",
      points: ["14 credits received since Monday", "9 auto-resolvable via reference repair", "5 blocked on buyer verification"],
      timeline: [
        { at: "2026-11-24", label: "First unmatched credit lands" },
        { at: "2026-11-26", label: "Match rate drops below 90%", tone: "warn" },
        { at: "2026-11-28", label: "14 unmatched, €412k", tone: "warn" },
      ],
    },
    remit: {
      status: { label: "Remediable", tone: "good" },
      summary: "Reference prefixes are transposed; amounts reconcile.",
      points: ["Pattern INV- written as IVN-", "Match confidence 0.97 with transposition tolerance", "Resolves 9 credits"],
    },
    buyer: {
      status: { label: "Posting blocked", tone: "bad" },
      summary: "Five credits from Halden cannot be posted pending receipt verification.",
      points: ["€168k pending application", "No receipt verifications on file", "Same obligor subject to the concentration breach"],
    },
    receipt: {
      status: { label: "Verification outstanding", tone: "bad" },
      summary: "Operations policy mandates verification for receipts above €25k.",
      points: ["5 required, 0 on file", "The action requests all five in a single edit plan"],
    },
  },
  2: {
    invoice: {
      status: { label: "Duplicate detected", tone: "bad" },
      summary: "Two invoices issued against a single shipment.",
      points: ["Same PO-55810", "11 of 12 lines identical", "Amounts within 0.4%", "Billed 6 days apart"],
      timeline: [
        { at: "2026-11-14", label: "INV-20931 issued and funded" },
        { at: "2026-11-20", label: "INV-20947 issued", tone: "warn" },
        { at: "2026-11-21", label: "INV-20947 submitted for funding", tone: "bad" },
        { at: "Proposed", label: "Pause funding, open RC-1192", tone: "info" },
      ],
    },
    seller: {
      status: { label: "Under review", tone: "warn" },
      summary: "First recorded duplicate; dilution has doubled over the period.",
      points: ["Dilution 2.0% → 4.1%", "No prior duplicates", "Probable clerical error; funding suspension still required"],
    },
    dispute: {
      status: { label: "Increasing", tone: "warn" },
      summary: "Short-delivery claims against the same seller are increasing.",
      points: ["3 open disputes", "€38k under dispute"],
    },
  },
  3: {
    collection: {
      status: { label: "Past due", tone: "bad" },
      summary: "€1.8M past due, concentrated in three obligors.",
      points: ["63 invoices", "71% past 60 days", "Top 3 buyers hold 80%"],
      timeline: [
        { at: "Q3", label: "DSO 49 days" },
        { at: "2026-11-01", label: "Last receipt from Halden", tone: "warn" },
        { at: "2026-11-28", label: "DSO 58 days", tone: "bad" },
      ],
    },
    buyer: {
      status: { label: "Priority 1", tone: "bad" },
      summary: "Largest and most aged exposure, with no promise to pay on record.",
      points: ["€740k overdue", "Oldest invoice 94 days", "AP “on hold pending audit”"],
      timeline: [
        { at: "2026-11-01", label: "Last payment received" },
        { at: "2026-11-22", label: "Obligor AP suspends payments", tone: "bad" },
        { at: "Proposed", label: "Assignment to senior collector", tone: "info" },
      ],
    },
    contact: {
      status: { label: "No follow-up recorded", tone: "warn" },
      summary: "The cause of the payment suspension was recorded but not escalated.",
      points: ["Telephone call with Halden accounts payable", "No follow-up task recorded"],
    },
    instal: {
      status: { label: "At risk", tone: "warn" },
      summary: "Scheduled facility repayments depend on receipts from Halden.",
      points: ["2 instalments, €410k", "Due 12-05 and 12-19"],
    },
  },
};
SCENARIOS.forEach((sc, i) => {
  for (const [id, extra] of Object.entries(EXTRAS[i] ?? {})) if (sc.details[id]) Object.assign(sc.details[id], extra);
});

/** Scripted match first; otherwise walk the real graph from whatever the question names. */
export function buildScenario(q: string): Scenario {
  const lq = q.toLowerCase();
  const hit = SCENARIOS.find((s) => s.match.some((m) => lq.includes(m)));
  if (hit) return hit;

  const named = OBJECTS.filter(([, label]) =>
    label.toLowerCase().split(" ").some((w) => w.length > 3 && lq.includes(w.replace(/s$/, ""))),
  ).map(([id]) => id);
  const seeds = named.length ? named.slice(0, 2) : ["invoice", "buyer"];
  const seen = new Set(seeds);
  const hops: string[][] = [];
  let frontier = seeds;
  for (let h = 0; h < 2; h++) {
    const next: string[] = [];
    for (const n of frontier)
      for (const m of ADJ[n])
        if (!seen.has(m) && NODES[m].kind === "object" && next.length < 5) {
          seen.add(m);
          next.push(m);
        }
    if (!next.length) break;
    hops.push(next);
    frontier = next;
  }
  const fire = LOGIC.filter((l) => l.kind !== "action" && l.targets.some((t) => seen.has(t)))
    .slice(0, 4)
    .map((l) => l.id);
  const links = LINKS.filter(([a, b]) => seen.has(a) && seen.has(b)).length;
  const ref = (id: string) => `[[${id}|${NODES[id].label}]]`;

  return {
    prompt: q,
    match: [],
    entities: seeds.map((s) => NODES[s].label).concat("intent · explore"),
    seeds,
    hops,
    fire,
    answer: `Starting from ${seeds.map(ref).join(" and ")}, I walked ${seen.size - seeds.length} linked object types in ${hops.length} hops: ${hops.flat().map(ref).join(", ")}. They're joined by ${links} typed links, and ${fire.length} pieces of business logic already watch this neighbourhood (${fire.map((f) => NODES[f].label).join(", ")}). Ask me about risk, cash matching, duplicates or overdue collections and I'll reason all the way to an action.`,
    metrics: [
      { label: "Objects", value: String(seen.size), tone: "info" },
      { label: "Links", value: String(links), tone: "info" },
      { label: "Logic", value: String(fire.length), tone: "good" },
      { label: "Hops", value: String(hops.length), tone: "info" },
    ],
    rag: { chunks: 3, answer: "“…” (3 loosely similar paragraphs, no relationships between them)" },
    details: {},
  };
}

/** Formal display labels for detail property keys. */
const PROP_LABEL: Record<string, string> = {
  value: "Value", oldest: "Earliest value date", "auto-fixable": "Auto-remediable", blocked: "Blocked",
  pattern: "Reference pattern", confidence: "Match confidence", payer: "Payer", messages: "Messages",
  "amounts match": "Amounts reconciled", valueDate: "Value date", unmatched: "Unapplied credits",
  verifications: "Verifications on file", required: "Required", "on file": "On file", policy: "Policy threshold",
  count: "Count", held: "Postings on hold", "releasable now": "Eligible for release", shared: "Identical lines",
  differs: "Variance", dilution: "Dilution rate", "prior dups": "Prior duplicates", reason: "Primary reason",
  items: "Staged items", overdue: "Past-due balance", "promise-to-pay": "Promise to pay", channel: "Channel",
  with: "Counterparty", summary: "Summary", due: "Due dates", headroom: "Available headroom", owner: "Owner",
  priority: "Priority", limit: "Facility limit", drawn: "Drawn balance", utilisation: "Utilisation",
  status: "Status", rating: "Credit rating", terms: "Payment terms", exposure: "Exposure", DSO: "Days sales outstanding",
  cap: "Concentration limit", current: "Current concentration", breach: "Excess over limit", since: "Breach date",
  metric: "Metric", delta: "Change", window: "Observation window", firedAt: "Triggered", stage: "Stage",
  severity: "Severity", openedAt: "Opened", "avg age": "Average age", disputed: "Under dispute", amount: "Amount",
  requested: "Requested", sellerId: "Seller ID", segment: "Segment", amounts: "Amounts", PO: "Purchase order",
  issued: "Issue dates", funded: "Funding status", ">60d": "Past due > 60 days", invoices: "Invoices",
  buyers: "Obligor concentration", links: "Related object types", "watched by": "Governing logic",
  reads: "Input object types", edits: "Edits", mode: "Commit mode",
};
export const propLabel = (k: string) =>
  PROP_LABEL[k] ?? k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\bId\b/, "ID").replace(/^./, (c) => c.toUpperCase());

export interface Seg {
  text: string;
  ref?: string;
}
export function parseAnswer(s: string): Seg[] {
  const out: Seg[] = [];
  const re = /\[\[(\w+)\|([^\]]+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ text: m[2], ref: m[1] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}
