# AIDO-FE Project Profile

## Mission
AIDO-FE is the React + TypeScript frontend for AIDO/N9E workflows, optimized for low-intrusion customization and upstream sync compatibility.

## Product Direction
- Feature benchmark target: Flashcat Professional/Enterprise feature set (functional parity focus only).
- Default strategy: extend existing pages/flows with plugin-style integration.
- RUM exception strategy: allow dedicated RUM module pages/routes when required by product IA, while keeping all new logic under extension/plugin boundaries.

## Technical Baseline
- Language: TypeScript
- Framework: React 17 + Hooks
- Build: Vite
- UI: Ant Design + project theme tokens
- Routing: React Router (existing route graph + plugin extension points)

## Architecture Map
- `src/pages/*`: page-level modules
- `src/components/*`: reusable UI components
- `src/services/*`: request layer
- `src/routers/*`: route composition
- `src/plugins/*`: plugin integration points
- `src/aido-extension/*`: decoupled custom business logic (preferred)
- `aido-doc/*` and `docs/*`: policy and sync process docs

## Operational Entry Points
- Start FE dev: `./dev-start-fe.sh`
- Build: `npm run build`
- Test: `npm test`

## Non-Negotiable Delivery Rules
1. Low intrusion first: extend existing flows before creating new pages/routes.
2. Datasource policy: prefer `/aido/log/explorer` and `/aido/log/index-patterns` branch extension.
3. RUM policy: dedicated route/module is allowed when necessary, but must remain isolated and avoid unrelated router churn.
4. Type safety: explicit props interfaces, avoid `any`.
5. Async safety: all async requests need explicit error handling.
6. UI consistency: use theme variables, no hardcoded colors.

## Upstream Sync Compatibility
- Keep plugin files as thin integration adapters when possible.
- Move non-trivial custom logic into `src/aido-extension/*`.
- Avoid formatting-only diffs in high-conflict files.

## Quality Gate
- Build must pass for delivery.
- Add targeted tests when behavior changes.
- Manual verification should reference the modified page flow.

## Communication Contract For Copilot
For every non-trivial task, the delivery should include:
1. Assumptions and acceptance criteria.
2. Changed files with user-visible impact.
3. Build/test verification outcome.
4. Risk notes and fallback plan.
5. Proposed commit message and PR-ready title/description.
