# Construction

**Layer:** [13-domain-packs](README.md) · **What it is:** Construction domain pack — a transferability test.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Earlier engineering notes (Phase 2)

### Construction domain pack — transferability test

> Source: former `13-domain-packs/construction/README.md` (moved here in the Nov 2026 restructure)

Candidate objects: Project, Site, Building, WorkPackage, Contractor, Subcontractor, Person, Asset, Equipment, Material, PurchaseOrder, Delivery, GRN, Drawing, Revision, RFI, Submittal, Inspection, Defect, ChangeOrder, ScheduleActivity, SafetyIncident, Permit, Invoice and Claim.

Candidate workflows: procurement, delivery receiving, damage/shortage report, inspection, RFI response, drawing revision, variation/change order, subcontractor payment, safety incident and project closeout.

The purpose is to test cross-domain architecture: spatial/time relationships, revisions, responsibility, approvals and source ownership. If the ontology engine requires hard-coded legal or finance concepts, it is not general enough.

## New research (28 Nov 2026)

### Source system: Procore's object model
- Project-level resources include RFIs, submittals, drawings, specifications, meetings, daily logs (equipment, accidents, calls), quality and safety items, and tiered **locations** that link RFIs, submittals, drawings and documents to jobsite places. Source: https://procore.github.io/documentation/object-model-project
- Financial objects: potential change orders, commitment change orders, purchase-order and work-order contracts, requisitions, budget line items, payment applications. Source: https://jentic.com/apis/procore.com/procore.md
- **Constraint:** Procore's API guidelines permit transactional workflows (create/update RFIs, submittals, daily logs; read project and financial data) but prohibit high-volume retrieval to power non-complementary analytics or intelligence products. A construction pack must be designed as a complementary app, not a bulk mirror. Source: https://procore.github.io/documentation/api-usage-guidelines

### Who already ships agents here
- **Procore** — agents from its DataGrid acquisition, including a Submittal Reviewer Agent that cross-checks submittals against specs, drawings and contracts, and an RFI Agent. Sources: https://www.procore.com/blog/your-digital-coworkers-are-ready-to-work , https://www.enr.com/articles/63042-procore-releases-new-ai-agents-after-datagrid-integration
- **Trunk Tools** — Cortex (17 June 2026), a drawings-trained intelligence layer powering drawing-revision, RFI, bid-analysis and submittal agents. Source: https://amerisurv.com/2026/06/17/trunk-tools-launches-cortex-to-tackle-constructions-hardest-ai-problem-drawings/
- **Document Crunch** (Trimble) — project-level contract and drawing risk review; claims 10,000+ projects and $350B annual volume. Source: https://www.forconstructionpros.com/construction-technology/construction-safety-technology/product/22969069/document-crunch-document-crunch-expands-ai-platform-to-deliver-projectlevel-risk-intelligence

### Candidate objects (from the sources above)
Project, Location, Drawing (revision), Specification section, RFI, Submittal, Change event / Potential change order, Commitment, Budget line, Pay application, Daily log, Inspection / Observation / Punch item, Company, Contact. Key links: RFI ↔ Drawing/Spec/Location; Submittal ↔ Spec section; Change order ↔ Commitment ↔ Budget line.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No research literature material in the research yet.
