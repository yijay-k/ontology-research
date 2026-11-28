#!/bin/bash
# ============================================================================
# scripts/demo/wwi/load.sh - load Wide World Importers receivables and draft
# an ontology from them.
#
#   python3 -I scripts/demo/wwi/prepare.py <raw-dir> <clean-dir>
#   bash scripts/demo/wwi/load.sh <clean-dir> [--apply]
#
# Creates one dataset per table directory of <clean-dir> (every part-*.csv
# uploaded into it), an ontology `wwi` if none of that name exists, and asks
# svc-ontology to draft object and link types from the datasets. The proposal
# is written to <clean-dir>/draft.json; --apply also creates the drafts as
# EXPERIMENTAL dataset-backed types, which makes svc-objects sync the rows.
# Talks to the service ports, like the other seeds; no credential is written
# here (scripts/lib/auth.sh reads them from the environment).
# ============================================================================
set -euo pipefail

CLEAN="${1:?usage: load.sh <clean-dir> [--apply]}"
APPLY="${2:-}"
ONTOLOGY_SVC="${ONTOLOGY_SERVICE_URL:-http://localhost:8081}"
DATASETS_SVC="${DATASETS_SERVICE_URL:-http://localhost:8085}"
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../lib/auth.sh"

json() { python3 -c "import json,sys; print(json.load(sys.stdin)$1)"; }

ONT=$(of_curl -sf "$ONTOLOGY_SVC/api/v2/ontologies" \
  | python3 -c "import json,sys; print(next((o['rid'] for o in json.load(sys.stdin)['data'] if o['apiName']=='wwi'), ''))")
if [ -z "$ONT" ]; then
  ONT=$(of_curl -sf -X POST "$ONTOLOGY_SVC/api/v2/ontologies" -H "Content-Type: application/json" \
    -d '{"apiName":"wwi","displayName":"Wide World Importers","description":"Receivables drafted from the Wide World Importers sample (Microsoft, MIT)"}' | json "['rid']")
fi
echo "ontology wwi: $ONT"

RIDS=()
for dir in "$CLEAN"/*/; do
  table=$(basename "$dir")
  rid=$(of_curl -sf -X POST "$DATASETS_SVC/api/v2/datasets" -H "Content-Type: application/json" \
    -d "{\"name\":\"$table\"}" | json "['rid']")
  for f in "$dir"part-*.csv; do
    of_curl -sf -X PUT "$DATASETS_SVC/api/v2/datasets/$rid/files/$(basename "$f")" \
      -H "Content-Type: text/csv" --data-binary "@$f" >/dev/null
  done
  echo "dataset $table: $rid"
  RIDS+=("{\"datasetRid\":\"$rid\"}")
done

BODY="{\"datasets\":[$(IFS=,; echo "${RIDS[*]}")]}"
QUERY=""; [ "$APPLY" = "--apply" ] && QUERY="?apply=true"
of_curl -sf -X POST "$ONTOLOGY_SVC/api/v2/ontologies/$ONT/drafts/fromDatasets$QUERY" \
  -H "Content-Type: application/json" -d "$BODY" > "$CLEAN/draft.json"
echo "draft written to $CLEAN/draft.json"
