#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SRC_REPO="https://github.com/n9e/fe.git"
BRANCH="${BRANCH:-main}"
DRY_RUN="0"
RETRY_TIMES="${RETRY_TIMES:-3}"
RETRY_INTERVAL_SEC="${RETRY_INTERVAL_SEC:-15}"

require_clean_worktree() {
  if ! git -C "${TARGET_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[ERROR] ${TARGET_DIR} is not a git repository"
    exit 1
  fi

  local changes
  changes="$(git -C "${TARGET_DIR}" status --porcelain)"
  if [[ -n "${changes}" ]]; then
    echo "[ERROR] Local changes detected. Commit or stash all changes before sync."
    echo ""
    echo "${changes}"
    exit 1
  fi
}

usage() {
  cat <<EOF
Usage:
  $(basename "$0") [--branch <name>] [--dry-run]

Options:
  --branch <name>     Checkout branch/tag from upstream (default: main)
  --dry-run           Show sync changes only
  -h, --help          Show this help

Environment:
  BRANCH              Same as --branch
  RETRY_TIMES         Clone retry count (default: 3)
  RETRY_INTERVAL_SEC  Retry interval in seconds (default: 15)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

for cmd in git rsync mktemp; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "[ERROR] Required command not found: ${cmd}"
    exit 1
  fi
done

if [[ "${DRY_RUN}" != "1" ]]; then
  require_clean_worktree
fi

TMP_DIR="$(mktemp -d "${TARGET_DIR}/.tmp-sync-upstream.XXXXXX")"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

CLONE_DIR="${TMP_DIR}/src"

clone_with_retry() {
  local attempts="$1"
  local interval_sec="$2"
  local try=1

  while (( try <= attempts )); do
    echo "[1/3] Cloning upstream (try ${try}/${attempts})"
    if git clone --depth 1 --branch "${BRANCH}" "${SRC_REPO}" "${CLONE_DIR}"; then
      return 0
    fi

    if (( try == attempts )); then
      break
    fi

    echo "[WARN] Clone failed, retry in ${interval_sec}s..."
    rm -rf "${CLONE_DIR}"
    sleep "${interval_sec}"
    try=$((try + 1))
  done

  echo "[ERROR] Failed to clone ${SRC_REPO} after ${attempts} attempts"
  return 1
}

clone_with_retry "${RETRY_TIMES}" "${RETRY_INTERVAL_SEC}"

RSYNC_ARGS=(
  -a
  --exclude=.git
  --exclude=.idea
  --exclude=.vscode
  --exclude=node_modules
  --exclude=dist
)

if [[ "${DRY_RUN}" == "1" ]]; then
  RSYNC_ARGS+=(--dry-run --itemize-changes)
  echo "[2/3] Preview sync changes (dry-run)"
else
  echo "[2/3] Syncing files into aido-fe workspace"
fi

rsync "${RSYNC_ARGS[@]}" "${CLONE_DIR}/" "${TARGET_DIR}/"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "[3/3] Dry-run completed. No files were changed."
else
  echo "[3/3] Sync completed."
fi

echo "Source: ${SRC_REPO}"
echo "Branch: ${BRANCH}"
