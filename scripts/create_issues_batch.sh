#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: GITHUB_TOKEN is required"
  exit 1
fi

OWNER="afterthemorning"
REPO="aido-fe"
API="https://api.github.com/repos/${OWNER}/${REPO}/issues"

create_issue() {
  local title="$1"
  local labels_json="$2"
  local body="$3"

  local payload
  payload=$(jq -n --arg t "$title" --arg b "$body" --argjson l "$labels_json" '{title:$t, body:$b, labels:$l}')

  curl -sS -X POST "$API" \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -d "$payload" >/dev/null

  echo "Created: $title"
}

create_issue "[P0][FE] RUM Route Group and Navigation Entry" '["frontend","P0","rum","routing"]' "Scope:\n- Add bounded /rum route group with feature flag.\n\nAcceptance:\n1. RUM routes appear only when feature enabled.\n2. Existing routes unaffected.\n3. Permission behavior correct.\n\nIntegration path:\nfeature flag -> route render -> permission check."

create_issue "[P0][FE] RUM Overview Page MVP" '["frontend","P0","rum","dashboard"]' "Scope:\n- Build RUM overview KPI + trends.\n\nAcceptance:\n1. Time range refresh works.\n2. Empty state handled.\n3. API error renders actionable message.\n\nIntegration path:\noverview page -> backend overview API -> chart render."

create_issue "[P0][FE] RUM Error List and Filters" '["frontend","P0","rum","errors"]' "Scope:\n- Error list with app/env/release/browser/time filters.\n\nAcceptance:\n1. Request params match contract.\n2. Pagination/sorting stable.\n3. Detail entry works.\n\nIntegration path:\nfilter panel -> error query API -> list/detail render."

create_issue "[P0][FE] RUM Session List and Detail Placeholder" '["frontend","P0","rum","session"]' "Scope:\n- Session list and detail timeline placeholders.\n\nAcceptance:\n1. Time range + dimension filters work.\n2. Detail opens with correct session id.\n3. Missing data handled gracefully.\n\nIntegration path:\nsession list API -> detail API -> UI render."

create_issue "[P0][FE] Alert-Notify Reuse Playbook Landing" '["frontend","P0","workflow","docs"]' "Scope:\n- Add playbook links for existing alert/notify pages.\n\nAcceptance:\n1. Links accessible from agreed navigation.\n2. Jump paths point to correct pages.\n3. No datasource-specific notify page added.\n\nIntegration path:\nexplorer/rule page -> playbook links -> end-to-end setup flow."

create_issue "[P1][FE] Alert Response Workspace Linking" '["frontend","P1","oncall","ux"]' "Scope:\n- Link rules/events/pipelines/notifications with context-preserving jumps.\n\nAcceptance:\n1. rule/event context preserved across jumps.\n2. Breadcrumb/back behavior predictable.\n3. No regressions in existing pages.\n\nIntegration path:\nrule detail -> current events -> pipeline -> notifications."

create_issue "[P1][FE] Source Governance Views" '["frontend","P1","datasource","governance"]' "Scope:\n- Add source health/policy/audit views.\n\nAcceptance:\n1. Health states rendered correctly.\n2. Policy update flow handles success/failure.\n3. Audit list filtering/pagination works.\n\nIntegration path:\ngovernance UI -> source governance APIs -> UI updates."

create_issue "[P1][FE] Admin Audit Visibility" '["frontend","P1","admin","audit"]' "Scope:\n- Add admin audit query UI.\n\nAcceptance:\n1. actor/action/resource/time filters work.\n2. Pagination stable.\n3. Unauthorized access blocked.\n\nIntegration path:\ntrigger backend changes -> audit API -> admin query UI."

create_issue "[P2][FE] RUM Trace and Log Correlation Jumps" '["frontend","P2","rum","trace"]' "Scope:\n- Jump from RUM issue/session to trace/log routes with context.\n\nAcceptance:\n1. Jump carries required context.\n2. Missing correlation gives fallback guidance.\n3. Target page opens expected state.\n\nIntegration path:\nRUM detail -> correlation API -> trace/log page."

create_issue "[P2][FE] RUM Policy Management UX" '["frontend","P2","rum","policy"]' "Scope:\n- Retention/sampling policy forms with validation and preview.\n\nAcceptance:\n1. Invalid values blocked client-side.\n2. Save reflects immediately.\n3. API failure rollback state clear.\n\nIntegration path:\npolicy form -> policy API -> refresh and ingest behavior checks."

create_issue "[P2][FE] Release Readiness and Regression Pack" '["frontend","P2","release","qa"]' "Scope:\n- Build release smoke checklist for RUM and alert/notify chain pages.\n\nAcceptance:\n1. Checklist covers happy/error paths.\n2. Build + smoke pass.\n3. Rollback notes available.\n\nIntegration path:\nstaging deploy -> checklist execution -> signoff."

echo "All frontend issues created."
