# Legal domain pack — research brief

## Purpose

Use legal workflows as the first vertical test of the general ontology. The domain pack should model legal operations, not make legal conclusions automatically.

## Candidate core objects

Client, Organisation, Matter, Engagement, Party, Person, Lawyer, Team, Court, Jurisdiction, Contract, Clause, Document, Version, EvidenceItem, Citation, Authority, Case, Obligation, Deadline, Filing, Hearing, Task, Approval, RiskIssue, Invoice, TimeEntry and Communication.

## Candidate relationships

Client owns Matter; Matter has Parties; Matter assigned to Team/Lawyer; Matter contains Documents; Document supersedes DocumentVersion; Document cites Authority; Clause creates Obligation; Obligation has Deadline; EvidenceItem supports/contradicts Claim; Matter has Court/Jurisdiction; Filing relates to Court/Matter; Invoice bills Client/Matter.

Every relationship should have source, scope, valid time, recorded time, access policy and evidence/provenance. “Person is counsel for Client” may be date-bounded and matter-specific rather than global.

## Candidate workflows

Matter intake and conflict check; document intake and classification; due diligence; contract review; clause extraction and obligation tracking; legal research with source citations; filing/deadline preparation; review/approval; client communication; matter close and retention.

## Safety boundary

Agents can summarise, retrieve, compare, draft and propose. Actions that bind clients, file documents, send legal advice, change deadlines or approve contractual positions must be subject to role-specific policy and human approval. Do not represent a model's extracted clause/obligation as authoritative without source citation and review state.

## Competency questions

- Which obligations in this matter have deadlines in the next 14 days, and what source clause establishes each one?
- Which contract versions contain a change in limitation of liability?
- Who may access this matter's documents, and why?
- Which claims in this draft are unsupported by the evidence bundle?
- What documents supersede an earlier version, and when did the new terms become effective?
- Which deadlines are business-valid versus recorded/updated by staff?

Harvey's public product surface is a vertical workflow reference (Agents, Vault, Knowledge, Workflows, Spaces, Contract Intelligence), but its private internal ontology is not publicly established by those descriptions.
