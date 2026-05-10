# AIDO-FE Product Roadmap and Competitive Benchmark

## Scope
This document is the single roadmap baseline for AIDO-FE UI evolution, combining:
- product benchmark against Flashcat (Nightingale, Enterprise, FlashDuty)
- 12-week delivery plan and issue backlog
- RUM and enterprise workflow enhancement path

Snapshot date: 2026-03-16.

## Benchmark Summary (Public Signals)

### Flashcat / Nightingale / FlashDuty observed capabilities
1. Unified observability surface: metrics, logs, traces, events in one workspace.
2. End-to-end response chain: alert aggregation, noise reduction, assignment, escalation, on-call.
3. Scenario products: Polaris (business impact discovery), FireMap (topology impact narrowing), Event Wall.
4. AI-ready path: system knowledge graph, data integration by API channel, domain knowledge input for AI analysis.
5. Strong collector and datasource lifecycle emphasis (integration, governance, operation visibility).
6. RUM presented as first-class journey with dedicated workflow depth.

## Current AIDO-FE Baseline (Code and Docs)
1. Core monitor/log/alert/notification pages exist and should remain stable.
2. Source Registry module exists and is largely implemented in extension style.
3. Source Registry still has P1-level interaction gaps (team selector, datasource selector, source_id validation, pagination, audit filtering, disabled click guard).
4. RUM direction is defined but currently roadmap-level; dedicated route/module is not fully delivered yet.
5. Alert-response journey exists but needs stronger cross-page context continuity.

## Capability Gap Matrix

| Domain | Flashcat signal | AIDO-FE status | Gap level | Priority |
|---|---|---|---|---|
| Unified observability IA | One integrated workspace across metrics/logs/traces/events | Core pages exist, but cross-domain workflow continuity is fragmented | Medium | P1 |
| RUM productization | Dedicated first-class RUM workflow and UX | Planned, not fully delivered | High | P0 |
| Incident response depth | Noise reduction, assignment, escalation, multi-channel on-call | Alert/notify chain exists, but response workspace cohesion can improve | Medium | P1 |
| Datasource/source governance | Source lifecycle, policy, audit visibility | Source Registry shipped but still has UX and governance gaps | Medium | P0 |
| AI-ready observability | Knowledge graph + query channel + domain knowledge loop | Architecture intent exists; UI and workflow support incomplete | High | P2 |
| Executive scenario views | Polaris / FireMap / Event Wall style scenario entry points | No dedicated scenario modules yet | Medium | P2 |

## Product Strategy

### Strategy principles
1. Lowest intrusion by default: keep existing monitor/log/datasource routes stable.
2. Extension-first delivery: place new domains under isolated extension or plugin boundaries.
3. Reuse before rebuild: prioritize jump paths and shared workflows over standalone duplicate pages.
4. Feature-flag rollout for new route groups and high-risk UX changes.

### IA evolution
1. Preserve existing core areas:
- monitor and explorer flows
- alert, events, pipelines, notification flows
- datasource and index-pattern management

2. Add bounded RUM area:
- route namespace: /rum/*
- overview, errors, sessions, performance, correlation

3. Strengthen enterprise response workspace:
- coherent jump path: alert-rules -> current events -> event pipelines -> notification rules/channels/templates
- preserve context while navigating (rule id, event id, query conditions)

4. Deliver datasource operations workspace:
- Source Registry as control plane entry for source onboarding, key lifecycle, policy, audit

## 12-Week Delivery Plan

### Phase P0 (Week 1-4): Foundation and Fast Parity
1. RUM route group and nav entry (feature-flagged).
2. RUM overview page MVP (KPI + trends).
3. RUM error list and filter model.
4. RUM session list and detail placeholder.
5. Source Registry gap fixes:
- G1 team selector
- G2 datasource selector
- G3 source_id regex validation
- G4 list pagination

Exit criteria:
- no regressions in existing monitor/log routes
- P0 pages handle loading, error, empty states
- typecheck/build pass

### Phase P1 (Week 5-8): Workflow Depth and Governance
1. Alert response workspace linking with context carry-over.
2. Source governance depth:
- G5 audit filters
- key/policy operation clarity
3. Admin audit visibility and query UX.
4. Datasource UI hardening fix:
- G6 disabled state click guard in category selector

Exit criteria:
- response chain navigation is predictable and testable
- governance pages support filter + pagination + permissions behavior

### Phase P2 (Week 9-12): Correlation and Intelligence
1. RUM-to-trace/log correlation jumps with context transfer.
2. RUM policy management UX (retention/sampling constraints and validation).
3. Scenario cockpit exploration:
- business impact and topology drill-down prototype (Polaris/FireMap-inspired)
4. AI-ready workflow scaffolding:
- query channels and knowledge input touchpoints in UI

Exit criteria:
- end-to-end correlation path verified
- release smoke checklist covers happy path and key failure path

## Execution Backlog (Ready for Tracking)
1. FE-P0-01 RUM route group and nav entry.                    [2026-05-10 ✅]
2. FE-P0-02 RUM overview MVP.                                  [2026-05-10 ✅]
3. FE-P0-03 RUM error list and filters.                        [2026-05-10 ✅]
4. FE-P0-04 RUM sessions and detail placeholder.
5. FE-P0-05 Alert-notify reuse playbook landing.
6. FE-P0-06 RUM (OpenTelemetry) datasource config.             [2026-05-10 ✅]
7. FE-P0-07 APM (OpenTelemetry) datasource config.             [2026-05-10 ✅]
8. FE-P1-01 Alert response workspace linking.
9. FE-P1-02 Source governance views.
10. FE-P1-03 Admin audit visibility.
11. FE-P1-04 Datasource OTLP compliance — validation rules, test-connection endpoint.
12. FE-P1-05 Datasource OTLP detail — health metrics, ingestion stats.
13. FE-P2-01 RUM trace/log correlation jumps.
14. FE-P2-02 RUM policy management UX.
15. FE-P2-03 Release readiness and regression pack.

## Acceptance and Verification Rules
1. Every async request must present loading/error/empty states.
2. Keep route and menu churn localized; no unrelated global rewiring.
3. Build and targeted regression checks are mandatory before merge.
4. Document risk and rollback path per phase.

## Risks and Controls
1. Risk: route expansion creates permission regressions.
- Control: feature flags plus permission guard validation per route group.

2. Risk: duplicated workflows across new and legacy pages.
- Control: enforce reuse-first and jump-path-first policy.

3. Risk: governance UI drifts from backend contract.
- Control: lock request/response contracts and add integration checklist.

## Change Log
- 2026-03-16: consolidated from previous RUM roadmap and 12-week backlog docs; added Flashcat benchmark matrix and phased enhancement design.
- 2026-05-10: added RUM & APM (OpenTelemetry) datasource types — baseCates, DatasourceCateEnum, Form/Detail components with OTLP protocol support, locale, dispatch routes; RUM error list page (FE-P0-03); updated execution backlog.

## Progress Record
- Date: 2026-03-16
- Completed:
	- consolidated roadmap and benchmark planning into this file
	- reorganized documentation structure under aido-doc with clearer naming
	- moved operational guides into aido-doc/playbooks
	- removed duplicate legacy planning documents

- Date: 2026-05-10
- Completed:
	- FE-P0-03 RUM error list page with filter, table, pagination, loading/empty/error states
	- FE-P0-06 RUM (OpenTelemetry) datasource — Form/Detail with OTLP HTTP/gRPC protocol
	- FE-P0-07 APM (OpenTelemetry) datasource — Form/Detail with OTLP HTTP/gRPC protocol
	- registered `rum` and `apm` in baseCates, DatasourceCateEnum, dispatch routes
	- zh_CN / en_US locale for both datasource types
	- ROADMAP backlog updated with new items and completion markers

## Retrospective
1. What worked:
- Existing planning content had strong building blocks; consolidation reduced overlap quickly.
- Source Registry design was already detailed, so alignment to enterprise roadmap was straightforward.

2. What to improve next:
- Keep all roadmap updates in one source of truth to avoid split planning drift.
- Add phase-level owner and target date fields in the next update for easier execution tracking.
