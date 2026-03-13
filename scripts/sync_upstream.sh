#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

REPO_SLUG="n9e/fe"
ARCHIVE_BASE="https://github.com/${REPO_SLUG}/archive/refs/tags"
BRANCH="${BRANCH:-v8.5.1}"
LOCAL_FILE=""
DRY_RUN="0"
RETRY_TIMES="${RETRY_TIMES:-3}"
RETRY_INTERVAL_SEC="${RETRY_INTERVAL_SEC:-15}"

setup_utf8_locale() {
  local chosen=""

  if ! command -v locale >/dev/null 2>&1; then
    return
  fi

  for loc in C.UTF-8 en_US.UTF-8 UTF-8; do
    if locale -a 2>/dev/null | grep -qx "${loc}"; then
      chosen="${loc}"
      break
    fi
  done

  if [[ -n "${chosen}" ]]; then
    export LANG="${chosen}"
    export LC_ALL="${chosen}"
  fi
}

# Auto-detect macOS system proxy and export https_proxy / http_proxy if not set.
setup_system_proxy() {
  if [[ -n "${https_proxy:-}" || -n "${HTTPS_PROXY:-}" ]]; then
    return  # already configured
  fi

  local service proxy_enabled proxy_server proxy_port
  for service in Wi-Fi Ethernet en0 en1; do
    proxy_enabled="$(networksetup -getsecurewebproxy "${service}" 2>/dev/null | awk '/^Enabled:/{print $2}')" || continue
    if [[ "${proxy_enabled}" == "Yes" ]]; then
      proxy_server="$(networksetup -getsecurewebproxy "${service}" 2>/dev/null | awk '/^Server:/{print $2}')"
      proxy_port="$(networksetup -getsecurewebproxy "${service}" 2>/dev/null | awk '/^Port:/{print $2}')"
      if [[ -n "${proxy_server}" && -n "${proxy_port}" && "${proxy_port}" != "0" ]]; then
        export https_proxy="http://${proxy_server}:${proxy_port}"
        export http_proxy="http://${proxy_server}:${proxy_port}"
        echo "[INFO] Using system proxy: ${https_proxy}"
        return
      fi
    fi
  done

  for service in Wi-Fi Ethernet en0 en1; do
    proxy_enabled="$(networksetup -getsocksfirewallproxy "${service}" 2>/dev/null | awk '/^Enabled:/{print $2}')" || continue
    if [[ "${proxy_enabled}" == "Yes" ]]; then
      proxy_server="$(networksetup -getsocksfirewallproxy "${service}" 2>/dev/null | awk '/^Server:/{print $2}')"
      proxy_port="$(networksetup -getsocksfirewallproxy "${service}" 2>/dev/null | awk '/^Port:/{print $2}')"
      if [[ -n "${proxy_server}" && -n "${proxy_port}" && "${proxy_port}" != "0" ]]; then
        export https_proxy="socks5://${proxy_server}:${proxy_port}"
        export http_proxy="socks5://${proxy_server}:${proxy_port}"
        echo "[INFO] Using system SOCKS proxy: ${https_proxy}"
        return
      fi
    fi
  done
}

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
  $(basename "$0") [--branch <tag>] [--file <path>] [--dry-run]

Options:
  --branch <tag>      Release tag to sync (default: v8.5.1)
  --file <path>       Use a local .tar.gz archive instead of downloading
  --dry-run           Preview sync changes only
  -h, --help          Show this help

Environment:
  BRANCH              Same as --branch
  RETRY_TIMES         Download retry count (default: 3)
  RETRY_INTERVAL_SEC  Retry interval in seconds (default: 15)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --file)
      LOCAL_FILE="$2"
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

for cmd in tar rsync mktemp; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "[ERROR] Required command not found: ${cmd}"
    exit 1
  fi
done
if [[ -z "${LOCAL_FILE}" ]] && ! command -v curl >/dev/null 2>&1; then
  echo "[ERROR] curl is required for downloading (or use --file to provide a local archive)"
  exit 1
fi

setup_utf8_locale
setup_system_proxy

# ── latest-tag check ──────────────────────────────────────────────────────────
# Query the GitHub Releases API to find the latest published release tag and
# warn the user if BRANCH is not up to date.
check_latest_tag() {
  local api_url="https://api.github.com/repos/${REPO_SLUG}/releases/latest"
  local latest

  # Prefer curl; fall back gracefully if unavailable or on timeout.
  if command -v curl >/dev/null 2>&1; then
    latest="$(curl -fsSL --max-time 8 "${api_url}" 2>/dev/null \
      | grep '"tag_name"' \
      | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')"
  fi

  if [[ -z "${latest}" ]]; then
    echo "[WARN] Could not determine the latest GitHub release (network issue?). Proceeding with ${BRANCH}."
    return
  fi

  if [[ "${BRANCH}" != "${latest}" ]]; then
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  [WARN] A newer upstream release is available!              │"
    printf "│  Current : %-49s │\n" "${BRANCH}"
    printf "│  Latest  : %-49s │\n" "${latest}"
    echo "│                                                             │"
    echo "│  Re-run with:                                               │"
    printf "│    BRANCH=%s ./scripts/sync_upstream.sh                   │\n" "${latest}"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
  else
    echo "[INFO] ${BRANCH} is the latest GitHub release."
  fi
}

echo "[INFO] Checking latest GitHub release for n9e/fe ..."
check_latest_tag

if [[ "${DRY_RUN}" != "1" ]]; then
  require_clean_worktree
fi

TMP_DIR="$(mktemp -d "${TARGET_DIR}/.tmp-sync-upstream.XXXXXX")"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

ZIP_FILE="${TMP_DIR}/fe-${BRANCH}.tar.gz"
# GitHub strips the leading 'v' from the top-level directory inside the archive.
EXTRACT_DIR_NAME="fe-${BRANCH#v}"
SRC_DIR="${TMP_DIR}/${EXTRACT_DIR_NAME}"
ARCHIVE_URL="${ARCHIVE_BASE}/${BRANCH}.tar.gz"

download_with_retry() {
  local attempts="$1"
  local interval_sec="$2"
  local try=1

  while (( try <= attempts )); do
    echo "[1/3] Downloading ${ARCHIVE_URL} (try ${try}/${attempts})"
    if curl -fsSL --max-time 120 -o "${ZIP_FILE}" "${ARCHIVE_URL}"; then
      echo "[1/3] Extracting archive ..."
      tar -xzf "${ZIP_FILE}" -C "${TMP_DIR}"
      return 0
    fi

    if (( try == attempts )); then
      break
    fi

    echo "[WARN] Download failed, retry in ${interval_sec}s..."
    rm -f "${ZIP_FILE}"
    sleep "${interval_sec}"
    try=$((try + 1))
  done

  echo "[ERROR] Failed to download ${ARCHIVE_URL} after ${attempts} attempts"
  return 1
}

if [[ -n "${LOCAL_FILE}" ]]; then
  if [[ ! -f "${LOCAL_FILE}" ]]; then
    echo "[ERROR] Local file not found: ${LOCAL_FILE}"
    exit 1
  fi
  echo "[1/3] Using local archive: ${LOCAL_FILE}"
  echo "[1/3] Extracting archive ..."
  tar -xzf "${LOCAL_FILE}" -C "${TMP_DIR}"
else
  download_with_retry "${RETRY_TIMES}" "${RETRY_INTERVAL_SEC}"
fi

if [[ ! -d "${SRC_DIR}" ]]; then
  echo "[ERROR] Expected extracted directory not found: ${SRC_DIR}"
  echo "        Contents of ${TMP_DIR}:"
  ls "${TMP_DIR}"
  exit 1
fi

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

rsync "${RSYNC_ARGS[@]}" "${SRC_DIR}/" "${TARGET_DIR}/"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "[3/3] Dry-run completed. No files were changed."
else
  echo "[3/3] Sync completed."
fi

if [[ -n "${LOCAL_FILE}" ]]; then
  echo "Source: ${LOCAL_FILE} (local)"
else
  echo "Source: ${ARCHIVE_URL}"
fi
echo "Tag:    ${BRANCH}"
