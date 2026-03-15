#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if [[ "${GUARDRAILS_BYPASS:-0}" == "1" ]]; then
  echo "[guardrail] bypassed by GUARDRAILS_BYPASS=1"
  exit 0
fi

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"
if [[ -z "$staged_files" ]]; then
  exit 0
fi

max_files="${MAX_STAGED_FILES:-40}"
max_lines="${MAX_STAGED_LINES:-800}"
exception_file="aido-doc/development-policies.md"
high_risk_regex='^(src/routers/|src/services/|src/components/SideMenu/|src/main.tsx$|src/App.tsx$|vite.config.ts$|plugins/)'

need_exception=0
reasons=()

file_count="$(printf "%s\n" "$staged_files" | grep -c . || true)"
if [[ "$file_count" -gt "$max_files" ]]; then
  need_exception=1
  reasons+=("large staged file count: $file_count > $max_files")
fi

staged_lines="$(git diff --cached --numstat | awk '($1 ~ /^[0-9]+$/){a+=$1} ($2 ~ /^[0-9]+$/){d+=$2} END{print a+d+0}')"
if [[ "$staged_lines" -gt "$max_lines" ]]; then
  need_exception=1
  reasons+=("large staged line changes: $staged_lines > $max_lines")
fi

high_risk_touched="$(printf "%s\n" "$staged_files" | grep -E "$high_risk_regex" || true)"
if [[ -n "$high_risk_touched" ]]; then
  need_exception=1
  reasons+=("high-risk paths touched")
fi

if [[ "$need_exception" -eq 0 ]]; then
  echo "[guardrail] check passed."
  exit 0
fi

if ! printf "%s\n" "$staged_files" | grep -qx "$exception_file"; then
  echo "[guardrail] check failed."
  printf "[guardrail] reason: %s\n" "${reasons[@]}"
  if [[ -n "$high_risk_touched" ]]; then
    echo "[guardrail] high-risk files:"
    printf " - %s\n" "$high_risk_touched"
  fi
  echo "[guardrail] add an exception note to $exception_file and stage it, using heading: '### Guardrail Exception: <date> <topic>'"
  exit 1
fi

exception_content="$(git show ":$exception_file" 2>/dev/null || true)"
if ! grep -q "### Guardrail Exception:" <<<"$exception_content"; then
  echo "[guardrail] check failed."
  echo "[guardrail] $exception_file is staged but no '### Guardrail Exception:' heading found."
  exit 1
fi

echo "[guardrail] check passed with documented exception."
