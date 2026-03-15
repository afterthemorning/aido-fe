# AIDO-FE Upstream Sync Guide

This guide explains how to sync AIDO-FE from the upstream repository.

Upstream source:
- https://github.com/n9e/fe.git
- Default branch: main

Script:
- ./scripts/sync_upstream.sh

## Workflow

1. Ensure local workspace is clean
2. Run dry-run first
3. Run real sync
4. Review and commit changes

## Commands

1. Check local status
   git status --short

2. Preview sync
   ./scripts/sync_upstream.sh --dry-run

3. Real sync
   ./scripts/sync_upstream.sh

4. Review changes
   git status --short
   git diff --stat

5. Commit sync result
   git add -A
   git commit -m "sync: update from n9e/fe main"

## Retry settings

The script retries clone automatically when GitHub is unstable.

- RETRY_TIMES: default 3
- RETRY_INTERVAL_SEC: default 15

Example:
RETRY_TIMES=5 RETRY_INTERVAL_SEC=20 ./scripts/sync_upstream.sh

## Notes

- Real sync requires a clean worktree.
- Local-only files are kept (no delete mode).
- To sync another branch temporarily:
  ./scripts/sync_upstream.sh --branch <branch>
