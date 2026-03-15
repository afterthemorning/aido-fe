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

Detailed checklist: [datasource-workflow.md](./references/datasource-workflow.md)

## Expected Deliverable
- Focused patch extending existing flow.
- No unnecessary new route/page.
- Build passes and behavior verified.
