---
name: aido-fe-datasource-extension
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
- Use project script for local FE startup (`./dev-start-fe.sh`).
- In `/aido` subpath mode, keep `VITE_PREFIX` and `PROXY` aligned with active backend stack.
- If datasource list is incomplete, verify backend runtime mode and API response before touching UI rendering code.

Detailed checklist: [datasource-workflow.md](./references/datasource-workflow.md)

## Expected Deliverable
- Focused patch extending existing flow.
- No unnecessary new route/page.
- Build passes and behavior verified.
