# AIDO-FE Development Policies

## Upstream Conflict Reduction (Decoupling First)

Effective date: 2026-03-14

Policy:
- New custom feature logic should be placed under `src/aido-extension` or `aido-*` folders whenever possible.
- Existing upstream plugin files should remain thin integration points; move non-trivial custom logic to decoupled extension files.
- If upstream plugin files must be changed, keep the diff minimal and isolate custom logic behind imports from `src/aido-extension`.

Pre-commit enforcement:
- Script: `scripts/check_decoupling_policy.sh`
- Script: `scripts/check_guardrails_policy.sh`
- Hook: `.githooks/pre-commit`

Enable hooks locally:
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/check_decoupling_policy.sh scripts/check_guardrails_policy.sh
```

Exception process:
- If a change must be made directly in high-conflict upstream files, add a brief exception note in this file before commit, including:
  - reason it is unavoidable,
  - affected paths,
  - conflict mitigation plan for upstream sync.

Guardrail trigger conditions:
- staged files exceed threshold (default 40), or
- staged changed lines exceed threshold (default 800), or
- changes touch high-risk FE core paths (`src/routers/*`, `src/services/*`, `src/components/SideMenu/*`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `plugins/*`).

Required exception heading format:
- `### Guardrail Exception: YYYY-MM-DD <topic>`

## Frontend Upgrade Assessment (Latest Release Target)

Effective date: 2026-03-15

Scope decision:
- This upgrade initiative is frontend-only for this phase.
- Backend dependencies in `aido` remain unchanged.
- Final objective is to reach latest release versions for the frontend stack with phased risk control.

### Compatibility Matrix (Current vs Latest)

| Component | Current | Latest Release | Compatibility | Risk | Notes |
|---|---:|---:|---|---|---|
| antd | 4.21.0 | 6.3.2 | Not directly compatible | High | `antd@6` requires React 18+ and has API/theming migration impact. |
| react | 17.x | 19.2.4 | Partial (via phased upgrade) | High | Recommend 17 -> 18 first, then assess 19 migration separately. |
| react-dom | 17.x | 19.2.4 | Partial (via phased upgrade) | High | Must move together with React upgrade. |
| react-router-dom | 5.2.0 | 7.13.1 | Breaking changes | High | Route definition and navigation APIs require broad refactor. |
| vite | 4.5.14 | 8.0.0 | Partial | Medium | Plugin/config compatibility validation required. |
| @vitejs/plugin-react | 4.4.1 | 6.0.1 | Coupled with Vite major upgrade | Medium | Upgrade together with Vite. |
| typescript | 4.9.4 | 5.9.3 | Partial | Medium | New type-checking errors expected and must be fixed incrementally. |
| ahooks | 3.5.0 | 3.9.6 | Mostly compatible | Low | Can be upgraded in early batches. |

### Known Migration Surface (Frontend)

- `antd` imports in source: ~742
- `visible` prop usage patterns: ~237
- `Tabs.TabPane` usage: ~69
- `overlayClassName` / `dropdownClassName` usage: ~61
- Existing theme path is Less + `modifyVars`, which increases migration complexity for newer Ant Design theming.

### Execution Policy (Frontend-Only, Latest Target)

1. Phase A (stabilization):
  - Upgrade to latest `antd@4` patch line first (`4.24.16`) to reduce drift safely.
2. Phase B (runtime baseline):
  - Upgrade React/ReactDOM from 17 to 18 and complete compatibility fixes.
3. Phase C (UI framework major):
  - Upgrade `antd` to 6.x and migrate component API usage and theming strategy.
4. Phase D (supporting stack to latest):
  - Upgrade Router, Vite, plugin-react, and TypeScript to latest release versions.

Acceptance criteria for completion:
- All frontend framework/tooling targets reach latest release versions at merge time.
- Dev startup, build, and core routes pass smoke checks.
- No backend dependency upgrade is included in this initiative.

## Exception Notes

### 2026-03-14: AIDO Excel plugin integration paths

- Reason: The alert-rule and explorer routing entrypoints resolve by plugin convention (`src/plugins/<type>/...`) and must expose plugin-level components (`AlertRule`, `Event`, `Explorer`) to be discoverable by existing runtime wiring.
- Affected paths:
  - `src/plugins/aidoExcel/index.tsx`
  - `src/plugins/aidoExcel/AlertRule/index.tsx`
  - `src/plugins/aidoExcel/Event/index.tsx`
  - `src/plugins/aidoExcel/Explorer/index.tsx`
- Conflict mitigation:
  - Keep these plugin files as thin integration adapters.
  - Put non-trivial business logic under `src/aido-extension/expiry/*` and import from plugin files when refactoring in subsequent iterations.
  - Avoid unrelated formatting or structural refactors in plugin files to minimize upstream merge conflicts.

### Guardrail Exception: 2026-03-15 Phase 2 Source Registry Backoffice UI

**Reason:** Initial delivery of Phase 2 (Backoffice Integration) as a single coherent batch.
- `src/routers/index.tsx`: 2 lines added — 1 import + 1 Route declaration. No routing logic changed.
- `src/components/menu/index.tsx`: 4 lines added — new menu item entry in existing structure.
- All UI logic (964 lines) is contained in `src/aido-extension/sourceregistry/` which is a new extension package with zero upstream conflict risk.
- `package.json` / `package-lock.json`: version normalization + caniuse-lite update (tooling fix, not feature code).
- This exception is a one-time bootstrap commit; future incremental changes will not trigger the threshold.
