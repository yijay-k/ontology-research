# GitHub publishing status

**Repository:** [yijay-k/ontology-research](https://github.com/yijay-k/ontology-research)  
**Branch:** `main`  
**Status:** Published. Tree last verified recursively at commit [`4de368c0abad303813d9178ecb560b655a66a148`](https://github.com/yijay-k/ontology-research/commit/4de368c0abad303813d9178ecb560b655a66a148) on 27 November 2026.

## Published contents

- **103 file blobs** are present on `main`.
- All **82 Phase 1 paths** are present.
- **21 post-Phase-1 paths** are present; see `file-manifest.md`.
- The repository tree response was not truncated.
- The existing README and original branch history were preserved. Commits were fast-forward; no force-push was used.
- The research-quality audit, Palantir OSv2 correction and source correction register are published.

This file and the manifest are being updated in the current commit; those edits do not add or delete paths, so the expected total remains 103 files.

## Phase 1 blob integrity

A recursive tree and Git blob comparison found 75 exact matches among the 82 Phase 1 files. Five expected working-document revisions account for five differences:

- `README.md`
- `15-repository-audits/README.md`
- `16-validation/file-manifest.md`
- `16-validation/phase2-research-backlog.md`
- `16-validation/publishing-status.md`

Two unexpected source-map mismatches remain:

| File | Expected Phase 1 blob SHA | Current main blob SHA |
|---|---|---|
| `sources/archive-original/30-map-palantir-platform.md` | `0b81e732b8aa6b9ad05101b0ca57980bcf684ce0` | `4def6d61b72c8c26eba22955855ce4ca916af590` |
| `sources/archive-original/31-map-lingyang-alibaba-offers.md` | `4ea84cc75a82ad8bd428a1ddb8660d82195f3000` | `6cd279c20db0d9c539fb81649a875696ea00f5f8` |

The baseline ZIP copies are byte-identical to the original `research-all-markdown.zip` copies. The remote maps have the same byte sizes but different Git blob hashes. Restoration and re-fetch verification remain open. Do not call the full archive byte-identical until that repair is complete.

## Access notes

The initial direct GitHub connector write path returned HTTP 403. A separate active GitHub connection under the `yijay-k` account was subsequently used successfully to publish the research pack. The old 403 handoff instructions are historical and should not be followed unless write access fails again.

## Integrity rule

A published file count is not a quality score. This status records file presence and source-hash exceptions only; it does not mean that all research claims are current, accurate or validated in a runtime.
