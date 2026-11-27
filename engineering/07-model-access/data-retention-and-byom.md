# Data retention and byom

**Layer:** [07-model-access](README.md) · **What it is:** What model providers keep, zero-retention guarantees and regional hosting.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1)

## Palantir

### 3. Data retention and provider guarantees

> Source: [general-references/03-palantir-aip.md § 3. Data retention and provider guarantees](../../general-references/03-palantir-aip.md#3-data-retention-and-provider-guarantees)

- When AIP uses third-party models, Palantir says no customer data in prompts or completions is retained by the provider, data is not used for retraining, provider staff have no access, and Palantir secures "technical and contractual guarantees" before enabling a model. [Vendor claim] https://www.palantir.com/docs/foundry/aip/aip-security/
- The capacity FAQ and the provider-compatible API page both say Palantir "guarantees zero data retention and regional routing". The capacity FAQ adds that **provider Batch APIs are not used because they require data storage that fails compliance**. That is one reason throughput is limited. [Fact] https://www.palantir.com/docs/foundry/aip/llm-capacity-management/ , https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/
- The security page does not say whether Palantir itself stores prompts. The observability docs show that it does capture prompts, responses and token usage in traces, and that chatbot session logs can be exported. [Fact] https://www.palantir.com/docs/foundry/aip-observability/trace-view/ , https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/
- Caveats: regional endpoint use depends on provider restrictions "which may change over time", and certifications apply "unless stated explicitly otherwise" in the contract. [Fact] https://www.palantir.com/docs/foundry/aip/aip-security/
- Exception: if a builder connects a local IDE (Claude Code, Copilot, Cursor) to Palantir MCP or Ontology MCP, tool outputs go to *that* provider under *that* provider's terms. Palantir MCP for local use is off by default. [Fact] https://www.palantir.com/docs/foundry/palantir-mcp/security/ , https://www.palantir.com/docs/foundry/ontology-mcp/overview/

## New research (28 Nov 2026)

### Provider retention as of late 2026 — this changed a lot this year
- **Anthropic:** for Mythos-class models (Fable 5, Mythos 5), prompts and outputs are retained for 30 days on every platform where they are offered, effective 9 June 2026; deleted automatically after 30 days except flagged or legally required cases. Some ZDR organisations are told they are eligible for "Enterprise Frontier Safeguards". Sources: https://support.claude.com/en/articles/15425996 , https://www.deeplearning.ai/the-batch/comparing-openai-and-anthropics-data-retention-policies
- **Anthropic API generally:** inputs and outputs deleted within 30 days; ZDR and HIPAA-ready arrangements available, with a per-feature eligibility table. Source: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- **OpenAI:** reaffirmed ZDR for eligible enterprise and API customers on frontier models (19 Aug 2026) and previewed "Private Safety Processing" to detect misuse across interactions without breaking ZDR. Sources: https://thenextweb.com/news/openai-zero-data-retention-private-safety-processing , https://axios.com/2026/08/19/openai-previews-zero-retention-safety-system-as-anthropic-requires-data-logs
- **Google (secondary source):** paid Gemini Developer API 55 days by default (configurable to 7, 14 or 28); Vertex AI 30 days. Reported, not checked against Google's own page. Source: https://proton.me/business/blog/what-zero-retention-data-means
- **Design consequence:** retention is per provider *and per model*, so the model gateway must store a retention profile per model and route sensitive tenants only to models whose profile they accept.

### Open-source gateway options
- LiteLLM 1.113.0 — MIT except `litellm/enterprise/`: [open-source-references/litellm](../../open-source-references/litellm.md).
- Portkey Gateway 1.15.2, MIT (last commit May 2026): [open-source-references/portkey-gateway](../../open-source-references/portkey-gateway.md).

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
