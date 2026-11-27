# Docling and Unstructured (document parsing)

| | |
|---|---|
| **Repository** | <https://github.com/docling-project/docling> |
| **Why it matters** | Permissive document parsers with layout and table structure. |
| **What to take** | Docling as a separate HTTP service called from TypeScript, with structure-aware chunking. |
| **What not to copy** | Embedding Python parsing inside the main service. |
| **Feeds** | [06-knowledge-and-evidence/document-parsing](../engineering/06-knowledge-and-evidence/document-parsing.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **adopt Docling as a separate HTTP service** called from TypeScript. It is the permissive choice with structure-aware chunking. [Inference]

## From the open-source code study: 28. Document parsing: Docling and Unstructured

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Docling: MIT, Python, version 2.151.1. It depends on `docling-core` (the DoclingDocument model and chunking), `docling-parse` and `docling-ibm-models` (layout, TableFormer), and has a `service_client` module. [Fact] ([pyproject.toml](https://github.com/docling-project/docling/blob/HEAD/pyproject.toml)). Unstructured: Apache-2.0, Python, version 0.27.38-dev. [Fact]
- Verdict: **adopt Docling as a separate HTTP service** called from TypeScript. It is the permissive choice with structure-aware chunking. [Inference]
