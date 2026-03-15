# AIDO-FE RUM and Enterprise UI Roadmap (Functional Parity)

## Goal
Build frontend capability trajectory aligned with Flashcat Pro/Enterprise functional domains, with RUM as a first-class user workflow.

## Strategy Update
- Keep low-intrusion as default for existing monitor/log/datasource workflows.
- Introduce bounded dedicated RUM module when needed (allowed exception), implemented in extension/plugin style.
- Avoid broad router churn: add a route group with isolated module boundaries.

## Public Benchmark Snapshot (2026-03)
1. Pro page signal: stronger alerting experience, broader datasource support, and better collector lifecycle operations.
2. Enterprise page signal: full-stack observability workspace (metrics/logs/traces/events) plus on-call workflow depth.
3. RUM page signal: independent user-facing product flow with performance, error, replay, explorer, dashboard, SDK onboarding, and trace correlation.

## Frontend Parity Implications
1. Existing monitor/log UI should remain stable and reusable.
2. RUM should be treated as a distinct first-class IA area, not a hidden branch under log explorer.
3. On-call and event response workflows should be progressively tightened into a coherent journey (rules -> events -> pipeline -> notification -> response).

## Proposed Information Architecture

### Existing Core Areas (Preserve)
1. Monitor and explorer flows
2. Alert/rules/events/notification flows
3. Datasource and index-pattern management

### New RUM Area (Add)
1. RUM Overview
   - Apdex-like experience score
   - Error/session/performance trend
2. RUM Errors
   - JS error/resource error/network error dimensions
3. RUM Sessions
   - Session list and timeline
   - Jump to session detail/replay metadata
4. RUM Performance
   - Web vitals and page-load waterfall summary
5. RUM Correlation
   - Link to trace/log views with trace/session filters

### Enterprise/Pro Depth Enhancements (Add)
1. Alert and response workspace
   - Unified jump path: alert-rules -> current events -> event pipelines -> notification rules/channels/templates
2. Datasource operations workspace
   - Source governance, health, and policy views with clearer lifecycle status
3. Audit and administration visibility
   - Operation/audit views integrated into admin workflows

## Route and Module Design
- Suggested route namespace: `/rum/*`
- Module placement:
  - Thin adapters in `src/plugins/*` if required by plugin conventions
  - Main business logic in `src/aido-extension/rum/*`
- Keep shared components reusable; isolate domain-specific components by folder.

## Frontend Capability Milestones

### M1: RUM MVP UI
1. Route skeleton and navigation entry
2. Overview + error list + session list pages
3. Basic query filters (app, env, release, time range)

### M2: Deep Analysis
1. Session detail view
2. Performance breakdown view (web vitals)
3. Error fingerprint grouping and top issue list

### M3: Correlation and Action
1. Jump from RUM issue to trace/log pages
2. Quick alert rule creation from RUM dimensions
3. Saved views and team collaboration enhancements

## Engineering Rules
1. All async requests must handle loading/error/empty states.
2. Props typed with interfaces; avoid `any`.
3. No hardcoded color values; use theme variables.
4. Avoid changing unrelated global route/menu logic.

## Delivery Template For RUM Features
1. User story and acceptance criteria.
2. Added/changed routes and why.
3. API dependencies and fallback behavior.
4. Build/test/manual verification result.
5. Risk and rollback note.

## Immediate Next UI Tasks
1. Create `src/aido-extension/rum` module skeleton.
2. Add RUM route group and menu entry with feature flag.
3. Build Overview page with mock API adapter.
4. Add Error list page with query/filter model.
5. Add Session list page with detail jump placeholder.
