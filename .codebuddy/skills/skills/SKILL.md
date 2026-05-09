---
name: aido
description: Workflow for low-intrusion backend development in AIDO. Use when implementing features, fixes, or refactors that must preserve core stability, prefer aido-extension placement, and pass focused checks before delivery.
license: Apache-2.0
---

# AIDO Low Intrusion Workflow

Use this skill for backend work requiring strict isolation, extension-first implementation, and predictable validation.

## When To Use This Skill
- User asks for minimal or isolated changes.
- Feature can be implemented in `aido-extension/*`.
- Router or service wiring must be changed without broad core refactor.
- You need a repeatable implementation + verification sequence.

## Prerequisites
- Repo opened at root.
- Local dev services available when API checks are required.
- Go toolchain available for compile/tests.

## Workflow
1. Clarify assumptions and list non-goals.
2. Select target placement:
- Prefer extension module for custom business logic.
- Keep core changes as route/service registration only.
3. Implement smallest patch.
4. Run focused checks.
5. Record completion details.

## Runtime Checkpoint (Before Debugging)
- Confirm how the backend is running:
	- package test / release path (`deploy.sh`) vs compose dev path (`workflow.sh dev up` / `compose-dev.sh`).
	- Whether local binary is mounted into container (`/app/n9e`).
- If a feature exists in code but is not visible at runtime, treat runtime source mismatch as P0 hypothesis before code changes.

## No-New-Service Datasource Decision Rule
- If user asks for "no additional framework/service":
	- First reuse existing built-in ingestion/query chain in this repo (compose-bridge: categraf + victoriametrics + n9e datasource proxy).
	- Only propose new datasource protocol implementation when existing chain cannot satisfy required behavior.
- For Uptime Kuma metrics endpoint (`/metrics` exposition text):
	- Prefer scraping into existing TSDB path and query through Prometheus-like datasource.
	- Avoid adding standalone parser service unless there is a hard requirement that cannot be met by scrape flow.

Detailed checklist: [backend-workflow.md](./references/backend-workflow.md)

## Expected Deliverable
- Small patch set with explicit file-level rationale.
- Validation output summary.
- No unrelated refactor noise.

# Backend Workflow Checklist

## 1. Pre-change
- Confirm objective and acceptance criteria.
- Confirm lowest-intrusion boundary.
- Identify exactly which packages must change.

## 2. Placement Decision
- Can logic live in `aido-extension/*`?
- If yes, keep core as registration/mount points only.
- If no, document why core modification is required.

## 3. Implementation
- Make surgical edits only.
- Preserve existing style and API conventions.
- Keep naming explicit and domain-specific.

## 4. Validation
- Run: `./dev-quick-check.sh`
- If router/service changed, run focused tests for impacted packages.
- If external dependency is unavailable, document blocked checks.

## 5. Delivery Notes
- List changed files and reason per file.
- Summarize behavior impact.
- Include residual risk and next safe step.


---
name: aido-fe
description: Workflow for low-intrusion datasource UI development in AIDO-FE. Use when adding or adjusting datasource behavior by extending existing log explorer/index-pattern flows and plugin-based modules instead of creating standalone pages.
license: Apache-2.0
---

# AIDO-FE Datasource Extension Workflow

Use this skill when implementing datasource-related frontend changes with minimal disruption.

## When To Use This Skill

- New datasource support in log explorer or index-pattern flow.
- Existing page needs branch-specific behavior by datasource type.
- Requirement emphasizes low intrusion and plugin reuse.

## Prerequisites

- Node/npm dependencies installed.
- Local backend proxy available for integration checks.

## Workflow

1. Identify existing flow entry points.
2. Add datasource branch logic in existing flow.
3. Keep shared UI components unchanged when possible.
4. Add types and request-level error handling.
5. Validate with build/tests.

## Protocol Compatibility Check (Required)

- Before adding UI branches, verify backend query protocol for the datasource:
	- Prometheus Query API (`/api/v1/query`, `/api/v1/query_range`) vs exposition text (`/metrics`).
- If protocol does not match existing frontend assumptions, do not force-fit in UI; first align backend/query path strategy.

## Dev Startup Consistency

- Use unified workflow entry for local FE startup (`../aido/workflow.sh fe dev`).
- In `/aido` subpath mode, keep `VITE_PREFIX` and `PROXY` aligned with active backend stack.
- If datasource list is incomplete, verify backend runtime mode and API response before touching UI rendering code.

Detailed checklist: [datasource-workflow.md](./references/datasource-workflow.md)

## Expected Deliverable

- Focused patch extending existing flow.
- No unnecessary new route/page.
- Build passes and behavior verified.
