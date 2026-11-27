# Evidence and confidence model

| Label | Definition | Required basis |
|---|---|---|
| Documented | Project/company says a capability exists | Official docs or repository docs; link and retrieval date |
| Implemented | Mechanism exists in source code | Exact source path and explanation of the executed path |
| Test source inspected | A test is present for the mechanism | Exact test path and what it asserts; execution status stated |
| Validated | Behaviour was observed in an executable environment | Commit, environment, command, test or experiment, result and logs |
| Vendor claim | A company makes a product/customer/performance claim | Official marketing or case study; do not present as independent proof |
| Independent evidence | Third-party source supports the point | Publisher, date, methodology/limitations and link |
| Inference | Reasoned conclusion not explicitly asserted by a source | Supporting evidence and alternative explanations |
| Proposed | Recommendation for our platform | Problem, rationale, alternatives, risks and decision owner |

Confidence is assigned separately: **High** (multiple direct sources or direct implementation evidence), **Medium** (one direct source or indirect implementation path), **Low** (partial evidence, unclear version, or material unverified assumption). Confidence does not upgrade a documented feature into a validated feature.

Do not call a feature production-ready based only on a README, a demo, a passing unit test or a project architecture diagram. Do not call a product scalable without workload and operational evidence. Do not infer security from a policy schema without tracing enforcement to each read/write path.
