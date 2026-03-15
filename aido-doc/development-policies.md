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
Last version audit: 2026-03-15 (queried from npm registry)

Scope decision:
- This upgrade initiative is frontend-only for this phase.
- Backend dependencies in `aido` remain unchanged.
- Final objective is to reach latest release versions for the frontend stack with phased risk control.
- Work branch: `exp/antd6-illustration-lab`

### Version Audit (Registry-Verified, 2026-03-15)

| Package | package.json (current) | Latest Release | Source |
|---|---|---|---|
| antd | 4.21.0 | **6.3.2** | npm |
| @ant-design/icons | ^4.6.2 | **6.1.0** | npm |
| react | ^17.0.0 | **19.2.4** | npm |
| react-dom | ^17.0.0 | **19.2.4** | npm |
| react-router-dom | ^5.2.0 | **7.13.1** | npm |
| vite | ^4.5.14 | **8.0.0** | npm |
| @vitejs/plugin-react | ^4.4.1 | **6.0.1** | npm |
| typescript | 4.9.4 | **5.9.3** | npm |
| ahooks | ^3.5.0 | **3.9.6** | npm |
| tailwindcss | ^3.3.5 | **4.2.1** | npm |
| jest | ^29.7.0 | **30.3.0** | npm |

### Compatibility Matrix

| Component | Current | Target | Compatibility | Risk | Notes |
|---|---:|---:|---|---|---|
| antd | 4.21.0 | 6.3.2 | Not direct | High | Requires React 18+; API + theming migration needed |
| @ant-design/icons | ^4.6.2 | 6.1.0 | Coupled with antd | High | Upgrade together with antd major bump |
| react | 17.x | 19.2.4 | Phased | High | Recommend 17→18 first, then assess 19 separately |
| react-dom | 17.x | 19.2.4 | Phased | High | Must move together with react |
| react-router-dom | 5.2.0 | 7.13.1 | Breaking | High | `Switch`/`Route`/`useHistory` require broad refactor |
| vite | 4.5.14 | 8.0.0 | Partial | Medium | Config + plugin compat validation required |
| @vitejs/plugin-react | 4.4.1 | 6.0.1 | Coupled | Medium | Upgrade together with Vite |
| typescript | 4.9.4 | 5.9.3 | Partial | Medium | New type errors expected; fix incrementally |
| ahooks | 3.5.0 | 3.9.6 | Compatible | Low | Safe to upgrade early |
| tailwindcss | 3.3.5 | 4.2.1 | Partial | Medium | CSS class syntax changes; JIT default differs |
| jest | 29.7.0 | 30.3.0 | Partial | Low | Config and snapshot format changes |

### Known Migration Surface (Frontend)

- `antd` import sites: ~742
- `visible` prop on Modal/Drawer (→ `open`): ~237
- `Tabs.TabPane` usage (→ `items` array API): ~69
- `overlayClassName` / `dropdownClassName` (→ `popupClassName`): ~61
- Theme: currently Less + `modifyVars` → must migrate to antd `theme.token` + `ConfigProvider`
- Router: `Switch` → `Routes`, `useHistory` → `useNavigate`, `withRouter` removed

---

### Phase A — antd 4 Patch Stabilization (4.21.0 → 4.24.16)

Goal: Reach the last stable patch of antd 4 before the major jump. Safe minor-version change.

Steps:
1. On branch `exp/antd6-illustration-lab`.
2. Update `package.json`:
   - `"antd": "4.24.16"`
3. Install: `npm --cache ./.npm-cache install`
4. Run typecheck: `npx tsc --noEmit --skipLibCheck`
5. Fix any newly reported prop deprecation warnings (non-breaking; resolve one file at a time).
6. Smoke-check: `npm run dev` → verify key pages render.
7. Commit: `chore(deps): upgrade antd 4.21.0 → 4.24.16`

Acceptance: `npm run dev` starts without error; no regressions on Sources / Audit / Explorer pages.

---

### Phase B — React 17 → 18

Goal: Move runtime baseline to React 18, which is required by antd 6.

Steps:
1. Update `package.json`:
   - `"react": "^18.3.1"`
   - `"react-dom": "^18.3.1"`
   - `"@types/react": "^18"`
   - `"@types/react-dom": "^18"`
2. Install: `npm --cache ./.npm-cache install`
3. Migrate root render (usually in `src/main.tsx`):
   ```ts
   // Before
   import ReactDOM from 'react-dom';
   ReactDOM.render(<App />, document.getElementById('root'));

   // After
   import { createRoot } from 'react-dom/client';
   createRoot(document.getElementById('root')!).render(<App />);
   ```
4. Fix TypeScript errors: `npx tsc --noEmit --skipLibCheck 2>&1 | head -60`
   - Common: `ReactNode` narrowing, `children` prop no longer implicit in FC.
5. Smoke-check: `npm run dev`.
6. Commit: `chore(deps): upgrade react/react-dom 17 → 18`

Acceptance: App bootstraps; React DevTools shows React 18 runtime.

---

### Phase C — antd 4 → 6 (Major UI Framework Migration)

Goal: Migrate to antd 6.3.2 and @ant-design/icons 6.1.0.  
**Prerequisite:** Phase B must be complete (React 18 required by antd 6).

#### C.1 Dependency update

```bash
npm --cache ./.npm-cache install antd@6.3.2 @ant-design/icons@6.1.0
```

#### C.2 Theme migration

Remove Less `modifyVars` approach. Replace with antd `ConfigProvider` + `theme.token`:

```tsx
// vite.config.ts — remove css.preprocessorOptions.less.modifyVars block
// src/App.tsx (or root layout) — add:
import { ConfigProvider, theme } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#your-primary',
      // map previous modifyVars keys to token equivalents
    },
  }}
>
  <App />
</ConfigProvider>
```

Token mapping reference: https://ant.design/docs/react/migrate-less-variables

#### C.3 API migrations (batch with grep+sed or codemod)

**`visible` → `open`** (~237 sites):
```bash
# Preview
grep -rn 'visible=' src --include='*.tsx' --include='*.ts' | grep -v '//' | wc -l
# Migrate (Modal, Drawer, Popover, Tooltip, Dropdown)
find src -name '*.tsx' -o -name '*.ts' | xargs sed -i '' 's/\bvisible={\(.*\)}/open={\1}/g'
```
Manual review required after automated pass for false positives.

**`Tabs.TabPane` → `items` array** (~69 sites):
```tsx
// Before
<Tabs>
  <Tabs.TabPane key="k" tab="Label">content</Tabs.TabPane>
</Tabs>

// After
<Tabs items={[{ key: 'k', label: 'Label', children: content }]} />
```
Automated codemod difficult; migrate file-by-file starting with `src/aido-extension/`.

**`overlayClassName` / `dropdownClassName` → `popupClassName`** (~61 sites):
```bash
find src -name '*.tsx' | xargs sed -i '' \
  's/overlayClassName=/popupClassName=/g; s/dropdownClassName=/popupClassName=/g'
```

**`Tabs.TabPane` import cleanup:**
```bash
# Remove standalone TabPane from imports; it no longer exists in antd 6
grep -rn 'TabPane' src --include='*.tsx' | grep import
```

#### C.4 Icon package

`@ant-design/icons` 6.x is mostly API-compatible. Verify no removed icons:
```bash
grep -rn 'from.*@ant-design/icons' src --include='*.tsx' | grep -oP "'[A-Za-z]+'" | sort -u
```

#### C.5 Typecheck pass

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -100
```
Fix errors file-by-file. Common patterns:

### Guardrail Exception: 2026-03-15 Tabs API migration batch

Reason:
- antd Tabs.TabPane -> items migration and related compatibility adjustments touch many frontend files in one coordinated pass and exceed the staged-line guardrail threshold.

Affected paths:
- src/pages/**
- src/plugins/**
- src/components/**
- src/aido-extension/**

Conflict mitigation plan:
- keep migration scope limited to Tabs API and strict prop-compatibility fixes only;
- validate with typecheck/build before commit;
- avoid unrelated refactors and preserve existing behavior.
- `FormInstance` generics changed
- `TableColumnType` key narrowing stricter
- `UploadFile` type generics

#### C.6 Acceptance and commit

- `npm run dev` starts; all Tabs/Modal/Drawer components render.
- Commit: `feat(deps): upgrade antd 4→6, migrate component APIs and theme`

---

### Phase D — Supporting Stack to Latest

Goal: Upgrade build tooling and router to latest release.  
**Prerequisite:** Phase C complete (stable antd 6 baseline).

#### D.1 Vite 4 → 8 + @vitejs/plugin-react 4 → 6

```bash
npm --cache ./.npm-cache install vite@8.0.0 @vitejs/plugin-react@6.0.1
```

`vite.config.ts` changes likely required:
- `css.preprocessorOptions` key renames (Less is no longer needed after Phase C theme migration)
- `build.target` defaults changed in Vite 5+; review output
- `server.proxy` config format unchanged

Verify: `npm run build` produces clean dist.

#### D.2 TypeScript 4.9 → 5.9

```bash
npm --cache ./.npm-cache install typescript@5.9.3
```

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | wc -l
# Resolve remaining strict mode errors incrementally
```

New TS 5.x features available: `satisfies`, `const type params`, stricter module resolution.
Do not change `tsconfig.json` `strict` setting unless baseline is clean.

#### D.3 react-router-dom 5 → 7

```bash
npm --cache ./.npm-cache install react-router-dom@7.13.1
```

Breaking API changes:
- `Switch` → `Routes`
- `<Route component={X}>` → `<Route element={<X />}>`
- `useHistory()` → `useNavigate()`
- `withRouter` HOC removed → use hooks
- `<Redirect>` → `<Navigate>`

Audit entry points:
```bash
grep -rn 'useHistory\|withRouter\|<Switch\|<Redirect' src --include='*.tsx' | wc -l
grep -rn 'from.*react-router-dom' src --include='*.tsx' | wc -l
```

Work file-by-file from `src/routers/index.tsx` outward.

#### D.4 tailwindcss 3 → 4

```bash
npm --cache ./.npm-cache install tailwindcss@4.2.1
```

Tailwind v4 changes:
- Config moved: `tailwind.config.js` → `@import "tailwindcss"` in CSS with `@theme` block
- CSS variable-first design; `theme()` function replaced by CSS variables
- Run migration tool: `npx @tailwindcss/upgrade@latest`

#### D.5 jest 29 → 30

```bash
npm --cache ./.npm-cache install jest@30.3.0 @types/jest@30
```

Breaking changes: snapshot format updated (run `jest --updateSnapshot` after upgrade).

#### D.6 ahooks 3.5 → 3.9

```bash
npm --cache ./.npm-cache install ahooks@3.9.6
```

Mostly API-compatible minor upgrade. No known breaking changes from 3.5 → 3.9.

#### D.7 Final acceptance

```bash
npm run build          # Clean production build
npm run dev            # Dev server starts
npx tsc --noEmit       # Zero TS errors (goal; use --skipLibCheck if third-party blocks)
npm test               # Test suite passes
```

Commit: `chore(deps): upgrade vite/router/ts/tailwind/jest to latest release`

---

### Overall Upgrade Completion Criteria

- [ ] All packages in Version Audit table reach target latest release version
- [ ] `npm run dev` starts without error
- [ ] `npm run build` produces clean dist
- [ ] Core routes smoke-checked: Explorer, Dashboard, Source Registry, Login
- [ ] No backend (`aido`) dependencies modified
- [ ] Branch `exp/antd6-illustration-lab` merged to `release/1.0.0` after all phases pass

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

### Guardrail Exception: 2026-03-15 Phase B React 18 Upgrade

**Reason:** Bulk React 18 migration — large line count comes from package-lock.json regeneration (dependency tree changes), not feature code.
- `src/main.tsx`: 1 line changed — `ReactDOM.render` → `createRoot` (required React 18 root API).
- 13 source files: minimal type annotation fixes for React 18 `@types/react` strictness (children props, forwardRef generics, catch block typing). No logic changed.
- `package.json` / `package-lock.json`: dependency version bumps (react→18.3.1, react-dom→18.3.1, ahooks→3.9.6, @types/react→18, @types/react-dom→18).
- Remaining 9 antd 4 type errors are known and will be resolved in Phase C (antd 6 upgrade).

### Guardrail Exception: 2026-03-15 Phase C Antd 6 Migration Batch 1

**Reason:** antd 4→6 migration requires coordinated wide-touch updates (Popup prop rename, Dropdown overlay compatibility, and type alignment) across many feature modules.
- `package.json` / `package-lock.json`: upgraded `antd` to `6.3.2` and `@ant-design/icons` to `6.1.0`.
- Added compatibility shim: `src/components/AntdDropdownCompat/index.tsx` to bridge legacy `overlay` usage while migrating incrementally.
- Updated antd popup API usage in affected files: `visible`→`open`, `onVisibleChange`→`onOpenChange` for Modal/Drawer/Popover/Tooltip/Dropdown call sites.
- Added lightweight TS compatibility declaration for rc-picker import paths: `src/types/rc-picker-compat.d.ts`.
- Validation result in this batch: `npx tsc --noEmit --skipLibCheck` returns 0 errors.

### Guardrail Exception: 2026-03-15 Phase D1 Toolchain Upgrade (Vite 8 / TS 5.9)

**Reason:** Build toolchain major upgrade requires editing a high-risk core file (`vite.config.ts`) to match Vite 8/Rolldown behavior.
- `package.json` / `package-lock.json`: upgraded `vite` to `8.0.0`, `@vitejs/plugin-react` to `6.0.1`, `typescript` to `5.9.3`.
- `vite.config.ts`: migrated `rollupOptions.output.manualChunks` from object form to function form (required by Vite 8/Rolldown).
- `src/pages/targets/index.tsx`: fixed TS5 stricter `ReactNode` inference (`void` path removed from modal children).
- Validation in this batch:
  - `npx tsc --noEmit --skipLibCheck` passed.
  - `npm run build` passed (EXIT 0).
  - `npm test -- --runInBand` passed (25 suites, 139 tests).

### Guardrail Exception: 2026-03-15 Phase D2 Test Stack Upgrade (Jest 30)

**Reason:** Test framework upgrade regenerates lockfile with high changed-line count; source code changes are minimal and focused on test compatibility.
- `package.json` / `package-lock.json`: upgraded `jest` to `30.3.0`, `@types/jest` to `30.0.0`, `ts-jest` to `29.4.6`.
- `src/pages/dashboard/transformations/AddFieldFromCalculationTransformation/index.test.ts`: replaced removed matcher `toThrowError` with `toThrow` for Jest 30 compatibility.
- Validation in this batch:
  - `npm test -- --runInBand` passed (25 suites, 139 tests).
  - `npx tsc --noEmit --skipLibCheck` passed.
  - `npm run build` passed (EXIT 0).

### Guardrail Exception: 2026-03-15 Phase D3 Tailwind 4 Upgrade

**Reason:** Tailwind major version upgrade modifies dependency tree heavily in lockfile while source-level config changes are intentionally minimal.
- `package.json` / `package-lock.json`: upgraded `tailwindcss` to `4.2.1`, added `@tailwindcss/postcss@4.2.1`.
- `postcss.config.js`: switched plugin key from `tailwindcss` to `@tailwindcss/postcss` for v4 compatibility.
- Validation in this batch:
  - `npx tsc --noEmit --skipLibCheck` passed.
  - `npm run build` passed (EXIT 0).
  - `npm test -- --runInBand` passed (25 suites, 139 tests).

### Guardrail Exception: 2026-03-15 Phase D4 Router 7 Migration

**Reason:** `react-router-dom` 5→7 is a breaking migration that requires coordinated edits across route entrypoints and hook usage in many feature pages.
- `package.json` / `package-lock.json`: upgraded `react-router-dom` to `7.13.1`, removed `@types/react-router-dom`.
- `src/App.tsx` and `src/routers/index.tsx`: migrated `Switch`→`Routes`, `Redirect`→`Navigate`, `Route component=`→`Route element=`, removed unsupported `BrowserRouter.getUserConfirmation`.
- Route hook migration across affected pages/components: `useHistory`→`useNavigate`; `history.push/replace/goBack/go` adapted to `navigate(...)` patterns.
- `src/components/RouterPrompt/index.tsx`: replaced legacy `history.block` flow with `useBlocker`-based prompt interception.
- `withRouter` removal completed in task template forms; state-passing patterns updated to v7-compatible `Link state` and `navigate(..., { state })` usage.

Progress record:
- Phase D4 completed with zero TypeScript errors after migration (`npx tsc --noEmit --skipLibCheck`).
- Regression completed: build passed, tests passed, dev server smoke startup passed.

Retrospective:
- Bulk mechanical migration is effective for hook/call API renames, but routing structure files (`src/App.tsx`, `src/routers/index.tsx`) require manual, ordered conversion to avoid route precedence regressions.
- Utility functions that previously accepted `history` must be reviewed explicitly; automatic replacement can introduce invalid `navigate` references in non-component modules.

**Reason:** Initial delivery of Phase 2 (Backoffice Integration) as a single coherent batch.
- `src/routers/index.tsx`: 2 lines added — 1 import + 1 Route declaration. No routing logic changed.
- `src/components/menu/index.tsx`: 4 lines added — new menu item entry in existing structure.
- All UI logic (964 lines) is contained in `src/aido-extension/sourceregistry/` which is a new extension package with zero upstream conflict risk.
- `package.json` / `package-lock.json`: version normalization + caniuse-lite update (tooling fix, not feature code).
- This exception is a one-time bootstrap commit; future incremental changes will not trigger the threshold.

### Guardrail Exception: 2026-03-15 Vite 8 HMR fix + antd Illustration Style

Reason:
- `vite.config.ts`: remove `hmr: false` — Vite 8 clientInjectionsPlugin does not
  substitute `__HMR_CONFIG_NAME__` (and other `__*__` template vars) when hmr is
  disabled, causing `ReferenceError: __HMR_CONFIG_NAME__ is not defined` at runtime.
  Removing `hmr: false` restores Vite 8's standard client injection path.
- `src/App.tsx`: add `empty={{ image: Empty.PRESENTED_IMAGE_DEFAULT }}` on
  ConfigProvider to enable antd Illustration Style globally.

Affected paths:
- vite.config.ts
- src/App.tsx

Conflict mitigation plan:
- change is surgical: one line removed from server config, one prop + one import in App.tsx;
- validate with typecheck/build/tests before commit; all green.

### Guardrail Exception: 2026-03-15 antd Illustration Style token alignment

Reason:
- update root `ConfigProvider` theme in `src/App.tsx` to align with official antd
  Illustration Style token/component guidance (algorithm + token + components).

Affected paths:
- src/App.tsx

Conflict mitigation plan:
- keep change limited to `ConfigProvider` theme configuration and related import only;
- preserve project-specific font family behavior via `getFontFamilyByEnv`;
- run typecheck/build/tests and verify dev `@vite/client` injection output.

### Guardrail Exception: 2026-03-15 antd6 theme token root wiring

Reason:
- antd v6 theme token migration requires updating root provider and build-time less config, which are guardrail high-risk paths.

Affected paths:
- src/App.tsx
- vite.config.ts

Conflict mitigation plan:
- keep edits scoped to ConfigProvider theme wiring and less compatibility fallback only;
- validate with typecheck/build/tests before commit;
- avoid unrelated router/service/main-entry changes.
