# Channels

**Layer:** [12-apps-and-integration](README.md) · **What it is:** Where agents meet people: chat, email, voice, messaging apps.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Lingyang, AgentOne and Alibaba

### 9. Chat channels

> Source: [general-references/28-winnexo.md § 9. Chat channels](../../general-references/28-winnexo.md#9-chat-channels)

| Capability | DingTalk | Ali DingTalk | Feishu | WeCom |
|---|---|---|---|---|
| One-to-one and group chat bot | Yes | Yes | Yes | Yes |
| Group messages collected into knowledge | Yes | Yes | Yes | Limited |
| Meetings collected into knowledge | Yes | Yes | Yes | No |
| Documents collected into knowledge | Yes | Yes | No | No |
| Replies in a group without being mentioned | No | No | No | No |

Source: [Fact](https://robject.lydaas.com/help/en/support/im-capability-comparison).

- WeCom integration has three independent parts: account linking (who can log in, with organisation sync), mobile access (a mini app or a mobile web page) and the channel bot (chat and pushed results). One agent maps to one bot. Users pair once with a six-digit code valid for five minutes ([Fact](https://robject.lydaas.com/help/en/support/faq)).

## Other companies and products

### 2.1 Channels

> Source: [general-references/18-decagon.md § 2.1 Channels](../../general-references/18-decagon.md#21-channels)

| Function | What it does for the customer | Status / date |
|---|---|---|
| Chat | Web/app widget with brand colours, avatar, header; static or metadata-driven welcome message (by language, role, product line). Live-chat escalation into Zendesk Sunshine and Salesforce. | GA. https://decagon.ai/modules/customizations ; https://decagon.ai/product/integrations |
| Email | Configurable greetings, signatures, footers; default values when customer data is missing; built-in language detection; routing and human handoff via Zendesk and Intercom. | GA. Same sources |
| Voice (Decagon Voice) | Inbound and outbound phone agent; 70+ languages with automatic detection and mid-call switching; hundreds of voices including custom; tune speed, stability, tone, background effects; interruption handling; talks while working with progress updates; transfers with summary; Amazon Connect, RingCentral, SIP trunking, call forwarding. | GA. Voice 2.0 Sep 2025 (65% latency cut, per Sacra); Voice 3 1 Oct 2026. https://decagon.ai/product/voice ; https://decagon.ai/blog/voice-3 ; https://sacra.com/c/decagon/ |
| Outbound Voice | AOP-defined outbound call logic; handles callbacks, voicemail and robocall screeners; captures intent and outcome for next-best-action. | Spring 2026 release (exact date not given). https://decagon.ai/proactive-agents |
| SMS and WhatsApp | Named alongside voice in collections outreach; SMS used for payment links. | Mentioned 29 Oct 2026; no standalone product page found. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution |
| Decagon dialer | Own outbound dialer, or works alongside the customer's dialer. | Mentioned 29 Oct 2026. Same source |
| Personal Agent Gateway | Detects consumer AI agents (named: Instinct, Muse, dots), including unannounced ones; dedicated channel; business-set policies; customer-defined permissions; discovery and identity protocol (PACT, 6 Oct 2026). | Protocol spec "available now"; provider work ongoing (Oct 2026). Hertz/Muse live 13 Nov 2026. https://decagon.ai/blog/dialogues-2026 ; https://decagon.ai/blog |
| Decagon Assist | Copilot for human agents: auto summaries, suggested replies, in-tool actions, live transcription, analytics hub; on voice provides summaries, knowledge and live guidance after warm handoff. | GA (no date). https://decagon.ai/product/voice ; payments post above |

### Sierra voice architecture and voice sims

> Source: [general-references/12-agent-companies.md § Sierra voice architecture and voice sims](../../general-references/12-agent-companies.md#sierra-voice-architecture-and-voice-sims)

- Most Sierra conversations are voice. Responses must arrive within about 1 to 2 seconds. Thinking, listening and talking run in parallel, including listening for barge-in. "Progress indicators" are filler lines such as "pulling up your account". Transcription runs two models in parallel and a silence detector picks between them, because the model that handles thick UK accents hallucinates in silence. Speech-to-text, text-to-speech and voice-to-voice providers are multi-homed. Native voice-to-voice handles a small share of traffic: it costs nearly 10x more and its tool calling is weaker. About 60 languages are supported, and Hungarian word error rate reached about 20% on single models. [Vendor claim, secondary] https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- Voice sims (23 Sep 2025) use a dual loop. A simulated caller (goal, mood, language, patience, with synthetic voice, background noise and DTMF tones) exchanges audio chunks with the voice loop. An LLM judge grades pass or fail. Tests cover timing (silence, interruptions, overlap) as well as content. Sims run in CI to block bad changes. [Vendor claim] https://sierra.ai/blog/how-voice-sims-work
- Voice Personas (7 Aug 2026) and "Mossy" (9 Nov 2026) are voice-identity posts I did not open. [Unverified]

## Design decisions already in the reference maps

### 15. Channels

> Source: [general-references/34-map-agent-companies.md § 15. Channels](../../general-references/34-map-agent-companies.md#15-channels)

**Purpose.** Reach debtors on email and messaging first, and staff inside tools they already use. Example: first reminder by email with PDF invoice; second by WhatsApp utility template; internal "aging summary" posted to the controller in Teams.

**Design to implement.**
- **Build once, deploy to many channels**, with **per-channel exposure control**: for each channel choose which procedures, data and actions it gets (e.g. no payment-plan negotiation over SMS).
- **Email** first: branded templates, signatures, default values when data is missing, language detection.
- **WhatsApp** via the Cloud API / a BSP, using **utility templates** for reminders. Cost model per message category: utility templates are charged per message even inside the 24-hour window since 1 Oct 2026; service messages are paid outside the 72-hour entry window, with 1,000 free per number per month (BSP report); token pricing applies if Meta's own agent is used ($2 per million tokens, about 4 to 5 US cents a message). Store the category on every touch and price it.
- **SMS** as escalation channel (Xero switches to SMS).
- **Inbound input types:** declare which the agent cannot read (Meta cannot read PDFs or video) and send a fallback reply. Remittance PDFs are core to receivables, so our own channel must read them [Inference].
- **Allowlist pilot mode:** the agent talks only to chosen debtors first (`ai_audience = ALLOWLISTED_ONLY`).
- **Internal channels:** Teams/Outlook/Slack for staff questions and builder notifications.
- **Personal-agent channel** (customers' own AI agents) — later.

**Copies.**
- doc 19 §2I, What to copy 11: build once deploy everywhere; per-channel exposure of journeys, data and capabilities. https://sierra.ai/product/channels ; https://sierra.ai/blog/publish-to-chatgpt
- doc 18 §2.1: chat, email (greetings, signatures, defaults, language detection), SMS/WhatsApp in collections. https://decagon.ai/modules/customizations
- doc 20 Key findings 1, 3 and §1.4: WhatsApp pricing changes, token pricing, categories, MYR billing; §1.2B inbound limits and allowlist. https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/ ; https://360dialog.com/blog/?p=1433
- doc 20 §11: channel escalation email → SMS. https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/

**Left out, and why.** Voice (doc 19: largest Sierra channel but tau-voice shows audio-native models at 67% vs ~85% text; heavy investment). ChatGPT app publishing and Personal Agent Protocol (doc 19 §2N; doc 18 PACT) — watch, not v1.

**Open questions.** Malaysian WhatsApp per-message rates after 1 Oct 2026 were not read (doc 20 [Unverified]). Whether Meta treats a company chasing its own invoices as the excluded "Finance" vertical — this matters only if we use Meta's Business Agent; plain Cloud API templates are a different product [Inference].

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- No palantir material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
