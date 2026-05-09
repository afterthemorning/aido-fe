---
name: aido
description: AIDO unified development workflow — frontend (aido-fe) + backend (aido). Use for feature implementation, datasource extension, or bug fixes across the full stack.
license: Apache-2.0
---

# AIDO Development Workflow

## Project Structure

```
aido-fe/               # Frontend (React 18, Ant Design 6, Vite, TypeScript, tailwindcss)
  src/
    aido-extension/    # AIDO-specific feature extension modules
    components/        # Shared UI components
    pages/             # Page-level route components
    plugins/           # Datasource plugins (aidoExcel, aidoEmail, mysql, clickHouse, etc.)
    utils/             # Utilities and constants
    theme/             # Theme CSS variables (light/dark/gold)
  integrations/        # Built-in component payloads (alert rules, dashboards)
  public/              # Static assets (images, docs, fonts)

aido/                  # Backend (Go, Gin, GORM)
  aido-extension/      # Pluggable extension modules
  center/              # Core server logic and routers
  integrations/        # Built-in alert rules & dashboards JSON definitions
  models/              # GORM model definitions
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18, TypeScript |
| UI library | Ant Design 6.x, @ant-design/icons 6.x |
| Build tool | Vite |
| Styling | tailwindcss, Less, CSS Variables |
| Backend | Go 1.22+, Gin, GORM, MySQL/PostgreSQL |
| Package | npm, Go modules |
| Testing | Jest (FE), Go test (BE) |

## When To Use This Skill

- Implementing cross-stack features (datasource extension, regular report, expiry reminder).
- Adding or modifying AIDO-specific extension logic.
- Datasource plugin creation (frontend form/detail + backend router/service).
- Bug fixes or refactors requiring both UI and API changes.

## Prerequisites

- Backend: Go toolchain, Docker Compose (for dev services), local database.
- Frontend: Node.js 18+, npm dependencies installed.
- Unified dev entry: `../aido/workflow.sh` for full-stack or per-service startup.

## Extension Placement Rules

1. **Backend**: New business logic SHOULD go into `aido-extension/<module>/`. Keep `center/` changes limited to route registration and minimal wiring.
2. **Frontend**: AIDO-specific features SHOULD go into `src/aido-extension/<module>/`. Leverage `src/plugins/` for datasource-specific components.
3. **Built-in alert rules**: Add JSON files under `aido/integrations/<Component>/alerts/`. Backend loads them at startup via `center/integration/init.go`.

## Workflow Steps

### 1. Pre-change
- Confirm objective and acceptance criteria.
- Identify lowest-intrusion boundary (extension vs core).
- Check which stack layers must change (FE only / BE only / full stack).

### 2. Implementation (Backend)
- Prefer `aido-extension/*` for custom logic.
- Route registration only in `center/router/`.
- Service/query logic in `aido-extension/<module>/`.
- Datasource type registration in `dscache/` and `center/cconf/plugin.go`.

### 3. Implementation (Frontend)
- Prefer `src/aido-extension/` for feature components.
- Datasource forms/details go into `src/plugins/<datasource>/Datasource/`.
- Register in `src/utils/constant.ts` and `src/components/AdvancedWrap/utils.ts`.
- Locales in `<module>/locale/` with i18next.

### 4. Validation
- Backend: `./dev-quick-check.sh` (compile + focused tests).
- Frontend: `npx tsc --noEmit` (type check), `npm run lint` (ESLint).
- Full-stack: `../aido/workflow.sh fullstack dev`.

## Ant Design Usage

- Components imported from `antd` (v6.x).
- Icons from `@ant-design/icons` (v6.x).
- Theme via `ConfigProvider` with `theme.algorithm` for dark/light switching.
- Custom CSS variables prefixed `--fc-` in `src/theme/variable.css`.
- Deprecated `List` → use `ListCompat` wrapper.
- Deprecated `Dropdown` → use `DropdownCompat` wrapper.

## Expected Deliverable

- Focused patch set with explicit file-level rationale.
- No unnecessary refactoring beyond the scope.
- TypeScript compilation clean.
- Behavior verified via dev stack.
