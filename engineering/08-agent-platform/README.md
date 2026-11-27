# 08-agent-platform — Agent platform

A governed operator, not a prompt: agent loop and runtime, tools, session state, skills and procedures, MCP, guardrails, human-in-the-loop, evaluation.

[← Engineering index](../README.md)

| Component | What it is | Lines | Sources |
|---|---|---:|---:|
| [agent-loop-and-runtime](agent-loop-and-runtime.md) | The agent loop and the runtime that hosts it: frameworks, model orchestration and role-packaged agents. | 455 | 20 |
| [tool-design](tool-design.md) | Designing the tools an agent calls: granularity, identities, descriptions and errors. | 153 | 5 |
| [session-state-and-memory](session-state-and-memory.md) | Durable agent sessions, access to the task record, and per-customer memory across interactions. | 253 | 8 |
| [skills-and-procedures](skills-and-procedures.md) | Capturing a company's procedures as versioned skills/journeys/AOPs, and the builder that writes them. | 243 | 10 |
| [mcp-servers](mcp-servers.md) | Exposing and consuming tools over the Model Context Protocol (builder vs consumer servers). | 214 | 7 |
| [guardrails-and-injection](guardrails-and-injection.md) | Runtime defence: supervisors, prompt-injection defences, safe tool defaults and pre-send compliance. | 228 | 8 |
| [human-in-the-loop-and-handoff](human-in-the-loop-and-handoff.md) | When the agent asks, waits for approval, or hands the case to a human. | 122 | 5 |
| [evaluation-and-simulation](evaluation-and-simulation.md) | Golden sets, state-based checks, simulated users, replay of past runs, experiments and always-on monitoring. | 455 | 20 |
