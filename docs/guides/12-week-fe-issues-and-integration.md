# AIDO-FE 12-Week Issue Backlog, Acceptance Cases, and Integration Paths

## Mapping to P0/P1/P2
- P0 (Week 1-4): RUM MVP UI and alert-notify chain reuse UX.
- P1 (Week 5-8): Enterprise response workflow depth and governance visibility.
- P2 (Week 9-12): Correlation UX, policy UX, and release hardening.

## Frontend Issue Backlog (Ready to Create)

## FE-P0-01 RUM Route Group and Navigation Entry
- Suggested labels: frontend, P0, rum, routing
- Scope:
  - Add bounded RUM route group with feature flag support.
  - Keep existing routes unchanged.
- Acceptance cases:
  1. RUM menu and routes load only when feature flag enabled.
  2. Existing monitor/log routes are unaffected.
  3. Unauthorized users see expected access behavior.
- Integration path:
  - Toggle feature flag -> route available -> page render -> permissions check.

## FE-P0-02 RUM Overview Page MVP
- Suggested labels: frontend, P0, rum, dashboard
- Scope:
  - Build RUM Overview with KPI cards and trend charts.
- Acceptance cases:
  1. Time-range changes refresh data correctly.
  2. Empty data renders empty-state, not runtime error.
  3. API error renders actionable UI message.
- Integration path:
  - FE Overview request -> backend overview API -> chart rendering.

## FE-P0-03 RUM Error List and Filters
- Suggested labels: frontend, P0, rum, errors
- Scope:
  - Error list with filters (app/env/release/browser/time).
- Acceptance cases:
  1. Filter params are sent exactly as API contract.
  2. Pagination/sorting works with backend responses.
  3. Selecting item opens detail panel/page.
- Integration path:
  - FE filter panel -> backend error query -> list render -> detail call.

## FE-P0-04 RUM Session List and Detail Placeholder
- Suggested labels: frontend, P0, rum, session
- Scope:
  - Session list and session detail basic timeline placeholders.
- Acceptance cases:
  1. Session list respects time range and dimensions.
  2. Detail view opens with correct session id.
  3. Missing session data handled gracefully.
- Integration path:
  - FE session list request -> backend session APIs -> detail page request.

## FE-P0-05 Alert-Notify Reuse Playbook Landing
- Suggested labels: frontend, P0, workflow, docs
- Scope:
  - Add user-facing playbook links in relevant admin/help entry points.
- Acceptance cases:
  1. Playbook links accessible from agreed navigation location.
  2. Links point to correct existing pages for alert/notify chain.
  3. No new datasource notification page introduced.
- Integration path:
  - User starts in explorer/rule page -> follows playbook links -> completes chain setup.

## FE-P1-01 Alert Response Workspace Linking
- Suggested labels: frontend, P1, oncall, ux
- Scope:
  - Improve jump paths between alert-rules, current events, pipelines, notification pages.
- Acceptance cases:
  1. Context (rule id/event id) preserved across jumps.
  2. Breadcrumbs/back behavior predictable.
  3. No regressions in existing pages.
- Integration path:
  - Rule detail -> event list -> pipeline -> notification rule/channel/template.

## FE-P1-02 Source Governance Views
- Suggested labels: frontend, P1, datasource, governance
- Scope:
  - Add source health/policy/audit views.
- Acceptance cases:
  1. Health status rendering matches API state values.
  2. Policy update flow handles success/failure states.
  3. Audit list supports filter and pagination.
- Integration path:
  - FE governance page -> backend source governance APIs -> UI updates.

## FE-P1-03 Admin Audit Visibility
- Suggested labels: frontend, P1, admin, audit
- Scope:
  - Add operation audit query UI in admin area.
- Acceptance cases:
  1. Filters by actor/action/resource/time are functional.
  2. Large result sets paginate correctly.
  3. Unauthorized user blocked.
- Integration path:
  - Trigger config changes -> backend audit API -> admin audit UI verification.

## FE-P2-01 RUM Trace/Log Correlation Jumps
- Suggested labels: frontend, P2, rum, trace
- Scope:
  - Add jump actions from RUM issue/session to trace/log pages.
- Acceptance cases:
  1. Jump includes required query context.
  2. Missing correlation falls back to guidance message.
  3. Jump targets open in expected route state.
- Integration path:
  - RUM issue detail -> correlation API -> trace/log page with filters.

## FE-P2-02 RUM Policy Management UX
- Suggested labels: frontend, P2, rum, policy
- Scope:
  - Retention/sampling policy forms and previews.
- Acceptance cases:
  1. Form validation prevents invalid policy values.
  2. Saved policy reflects immediately in UI state.
  3. API failure rollback UI state is clear.
- Integration path:
  - FE policy form -> backend policy API -> FE refresh + ingest behavior checks.

## FE-P2-03 Release Readiness and Regression Pack
- Suggested labels: frontend, P2, release, qa
- Scope:
  - Build release smoke checklist for RUM + alert/notify chain pages.
- Acceptance cases:
  1. Checklist covers happy path and key error paths.
  2. Build and core page smoke pass.
  3. Rollback notes are available.
- Integration path:
  - Stage deployment -> execute checklist -> defect loop -> release signoff.

## Joint Debug Paths (FE Owner View)
- Path 1: SDK ingest to RUM UI
  - SDK snippet init -> ingest API success -> overview numbers -> error/session list entries.
- Path 2: Alert-notify reuse chain
  - Alert rule create -> current event appears -> pipeline processed -> notification delivered.
- Path 3: Correlation
  - RUM issue detail -> trace/log jump -> related records visible.

## Suggested Issue Creation Order
1. FE-P0-01
2. FE-P0-02
3. FE-P0-03
4. FE-P0-04
5. FE-P0-05
6. FE-P1-01
7. FE-P1-02
8. FE-P1-03
9. FE-P2-01
10. FE-P2-02
11. FE-P2-03
