#!/usr/bin/env bash
set -euo pipefail

# Policy: keep custom AIDO feature code in src/aido-extension or aido-* folders.

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"

if [[ -z "$staged_files" ]]; then
  exit 0
fi

violations=()

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  # Thin integration points in upstream plugin files: allowed
  if [[ "$file" == "src/plugins/aidoExcel/Datasource/Detail.tsx" || \
        "$file" == "src/plugins/aidoExcel/Datasource/Form.tsx" || \
        "$file" == "src/plugins/aidoExcel/services.ts" ]]; then
    continue
  fi

  if [[ "$file" == src/plugins/aido*/* || "$file" == src/plugins/aido* ]]; then
    if [[ "$file" != src/aido-extension/* ]]; then
      violations+=("prefer decoupled location for aido custom code: $file (move new logic to src/aido-extension/* and keep plugin files as thin integration points)")
    fi
  fi
done <<< "$staged_files"

if [[ ${#violations[@]} -gt 0 ]]; then
  echo "[policy] decoupling check failed."
  echo "[policy] reason: reduce upstream sync conflicts by concentrating custom code under src/aido-extension or aido-* folders."
  for v in "${violations[@]}"; do
    echo " - $v"
  done
  echo "[policy] if unavoidable, document an exception in aido-doc/development-policies.md before commit."
  exit 1
fi

echo "[policy] decoupling check passed."
