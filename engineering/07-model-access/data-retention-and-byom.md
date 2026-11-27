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

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
