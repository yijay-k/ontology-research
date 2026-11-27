# Cross-source verification

## Conflict resolution order

1. Current executable code at a pinned commit, for implementation claims.
2. Current official technical docs, for intended/public contract and platform guarantees.
3. Tests and CI definitions, for intended verification coverage (execution result is a separate fact).
4. Official product/marketing pages, for packaging and vendor positioning.
5. Customer case studies and independent reporting, for adoption and outcomes, with methodology caveats.
6. Earlier research notes and secondary summaries, as leads and historical evidence.

This ordering is not universal: code may be incomplete or a private hosted service may differ from the public repo. In such cases, explicitly explain the boundary instead of silently selecting the most convenient source.

## Version drift

Every correction must record the earlier statement, its origin document, the current source snapshot, the changed implementation, the effect on the conclusion and whether it changes a proposed design. Never edit the original research archive to erase an earlier error; add a correction record.

## Repository lineage

Before comparing two repositories, establish whether one is a fork/port of another. Shared code is not independent confirmation. For forks, compare divergent commits/modules and attribute inherited behaviour correctly.
