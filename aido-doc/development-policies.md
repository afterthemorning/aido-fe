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
