---
description: 'AIDO-FE React/TypeScript rules. Use for pages, components, datasource integrations, and plugin/extension-based UI changes.'
applyTo: '{src,plugins,scripts}/**/*.{ts,tsx,js,jsx,css,less}'
---

# AIDO-FE Rules

## Core Principles
- Keep changes minimal and non-intrusive.
- Follow existing React Hooks + TypeScript style.
- No hardcoded colors; use `theme/variable.css` variables.

## Datasource UI Policy
- Extend existing log query flow (`/aido/log/explorer` and `/aido/log/index-patterns`) as datasource branches.
- For datasource scenarios, do not create standalone explorer pages/routes unless explicitly requested.
- For RUM domain features, dedicated modules/routes are allowed if they are isolated under extension/plugin boundaries and do not break existing route contracts.
- Reuse existing plugin/plus patterns where possible.

## Code Quality
- Define component props with `interface`.
- Avoid `any` unless there is no safer practical type.
- All async requests require explicit error handling.

## Testing and Validation
- Preferred checks: `npm run build`, then targeted tests.
- Keep test files named `*.test.ts` or `*.spec.ts`.

## Collaboration
- If context is insufficient, state assumptions first.
- Report unrelated code smells without refactoring them.
