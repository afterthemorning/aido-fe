# Datasource Frontend Workflow Checklist

## 1. Scope Confirmation
- Confirm target datasource scenario.
- Confirm reuse target in existing explorer/index-pattern flow.
- Define what must not change.

## 2. Design Placement
- Prefer branch extension in existing flow.
- Reuse `plus/` or plugin pattern where applicable.
- Avoid adding standalone page or route.

## 3. Implementation
- Add explicit TypeScript interfaces.
- Add async error handling for API calls.
- Keep style variables from theme tokens only.

## 4. Validation
- Run: `npm run build`
- Run targeted tests for modified modules.
- Manually verify datasource branch in explorer flow.

## 5. Delivery Notes
- List changed files and why.
- Summarize user-visible behavior.
- Note residual risks and follow-up checks.
