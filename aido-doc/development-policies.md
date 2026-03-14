# AIDO-FE Development Policies

## Upstream Conflict Reduction (Decoupling First)

Effective date: 2026-03-14

Policy:
- New custom feature logic should be placed under `src/aido-extension` or `aido-*` folders whenever possible.
- Existing upstream plugin files should remain thin integration points; move non-trivial custom logic to decoupled extension files.
- If upstream plugin files must be changed, keep the diff minimal and isolate custom logic behind imports from `src/aido-extension`.

Pre-commit enforcement:
- Script: `scripts/check_decoupling_policy.sh`
- Hook: `.githooks/pre-commit`

Enable hooks locally:
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/check_decoupling_policy.sh
```

Exception process:
- If a change must be made directly in high-conflict upstream files, add a brief exception note in this file before commit, including:
  - reason it is unavoidable,
  - affected paths,
  - conflict mitigation plan for upstream sync.
