# Entity resolution

**Layer:** [02-data-platform](README.md) · **What it is:** Deciding that records from different systems are the same customer, matter or invoice.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Open-source implementations](#open-source-implementations) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Open-source implementations

### 27. Entity resolution: Splink

> Source: [open-source-references/splink.md](../../open-source-references/splink.md) (code study)

- MIT, Python, version 5.0.0, last commit 2026-11-11. It implements Fellegi–Sunter probabilistic linkage with blocking rules, comparison levels, m/u estimation by expectation-maximisation, term-frequency adjustments, connected-components clustering and `realtime.py` (score one new record against existing records). Backends are DuckDB, Spark, Postgres and SQLite. [Fact] ([splink/internals/](https://github.com/moj-analytical-services/splink/tree/HEAD/splink/internals))
- Verdict: **adopt as an offline batch job** (Python against your Postgres) for merging customers and suppliers across systems. Its output is match pairs and cluster ids, which your ontology stores as a link type. [Inference]

## Research literature

### 7. Entity resolution

> Source: [general-references/09-papers-knowledge-layer.md § 7. Entity resolution](../../general-references/09-papers-knowledge-layer.md#7-entity-resolution)

**Plain English.** "ACME Sdn Bhd" in the CRM, "Acme Sdn. Bhd." in the accounting system and "ACME" on an invoice PDF are the same supplier. The company model needs one object with three source records linked to it.

**Fellegi–Sunter (1969).** I. P. Fellegi & A. B. Sunter, "A Theory for Record Linkage", *Journal of the American Statistical Association* 64(328):1183–1210, 1969 (copies via [Cornell](https://cs.cornell.edu/~shmat/courses/cs6434/fellegi-sunter.pdf) and [UW](https://courses.cs.washington.edu/courses/cse590q/04au/papers/Felligi69.pdf)); citation matched to the search listing, PDF not opened. As implemented in Splink ([theory page](https://moj-analytical-services.github.io/splink/topic_guides/theory/fellegi_sunter.html)) [Fact]:
- λ is the prior probability that a pair matches.
- For each compared field, *m* = P(field agrees | match) and *u* = P(field agrees | non-match).
- Match weight = log2(λ/(1−λ)) + Σ log2(m_i/u_i), assuming independence; probability = 2^M/(1+2^M).
- Blocking rules restrict which pairs are compared: n(n−1)/2 is about 500 billion pairs for 1M records, and the pair count drives run time ([Splink blocking](https://moj-analytical-services.github.io/splink/topic_guides/blocking/blocking_rules.html)).
- Splink estimates m and u with EM and random sampling, as I understand it; the pages I opened point to a separate training guide [Unverified].

**Ditto.** Li et al., "Deep Entity Matching with Pre-Trained Language Models", PVLDB 14 (DOI 10.14778/3421424.3421431), arXiv:2004.00584 ([abs](https://arxiv.org/abs/2004.00584)). [Fact] Treats matching as sequence-pair classification with fine-tuned BERT/RoBERTa, plus domain-knowledge highlighting, summarisation of long values and hard-example augmentation. Up to 29% F1 over the prior state of the art; matches it with half the labels; 96.5% F1 on company tables of 789K × 412K records. Needs training, so for the product it would be a self-hosted small model [Inference].

**LLM matching.**
- Peeters, Steiner, Bizer, "Entity Matching using Large Language Models", arXiv:2310.11244 (v4 Oct 2024) ([abs](https://arxiv.org/abs/2310.11244)). [Fact] With zero or few examples, the best LLMs match PLMs fine-tuned on thousands of examples and are more robust to unseen entities. No single prompt is best everywhere. GPT-4 can explain its decisions and cluster its own errors.
- Wang et al., "Match, Compare, or Select?", arXiv:2405.16884 ([abs](https://arxiv.org/abs/2405.16884)). [Fact] *Selecting* the match from a candidate list beats pairwise yes/no matching. The ComEM framework combines strategies and models for lower cost.
Builder lesson: [Inference] a cascade. Deterministic keys first (tax ID, registration number, email), then Fellegi–Sunter scoring with blocking, auto-accepting high weights. For the grey zone, ask an LLM to *select* the best candidate from the top-k with a stated reason. Show low-confidence merges to a human, and keep every merge reversible with provenance.

## Design decisions already in the reference maps

### 5. Entity resolution

> Source: [general-references/32-map-research-and-cost.md § 5. Entity resolution](../../general-references/32-map-research-and-cost.md#5-entity-resolution)

**Purpose.** Recognise that "ACME Sdn Bhd" in the CRM, "Acme Sdn. Bhd." in the ledger and "ACME" on a remittance advice are one customer, so balances, disputes and contacts attach to one object. Receivables-specific case: matching an incoming bank payment's payer name to the right customer.

**Design to implement.** A cascade, cheapest step first:
1. *Deterministic keys*: tax ID, company registration number, email domain, bank account. Match means merge.
2. *Fellegi–Sunter scoring with blocking*.
   - Per compared field, m = P(agree | match) and u = P(agree | non-match).
   - Match weight = log2(λ/(1−λ)) + Σ log2(m_i/u_i), with probability = 2^M/(1+2^M).
   - Blocking rules (for example the same first token of the normalised name, or the same postcode) limit pair counts. n(n−1)/2 is about 500 billion pairs at 1M records.
   - Auto-accept above an upper threshold.
3. *Grey zone*: give the model the top-k candidates and ask it to *select* one (or none) with a stated reason. Do not ask a pairwise yes/no.
4. *Human review* for low-confidence merges.
5. Every merge is a reversible link `{source_record, canonical_object, method, weight, reason, decided_by, decided_at}`. Unmerging restores the source records.

**Evidence.**
- Splink formulas and the blocking pair counts (document 09, section 7).
- With zero or few examples, the best LLMs match PLMs fine-tuned on thousands of examples and are more robust to unseen entities (Peeters et al., arXiv 2310.11244).
- Selecting from a candidate list beats pairwise matching (arXiv 2405.16884).
- Ditto reached 96.5% F1 on company tables of 789K × 412K records, but needs training (arXiv 2004.00584).

**Copies.** Document 09, section 7 and "What to copy" item 18. https://moj-analytical-services.github.io/splink/topic_guides/theory/fellegi_sunter.html ; https://moj-analytical-services.github.io/splink/topic_guides/blocking/blocking_rules.html ; https://arxiv.org/abs/2310.11244 ; https://arxiv.org/abs/2405.16884

**Left out.** Ditto, which needs a trained model; maybe a self-hosted model in version 2.

**Open questions.**
- How Splink estimates m and u (EM plus random sampling) is [Unverified] in document 09.
- [Inference] Splink is a Python library, while the stack is TypeScript. Either reimplement the scoring (the formulas are simple) or run a Python worker.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
