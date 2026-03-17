#!/usr/bin/env bash
set -euo pipefail

# Cleanup GitHub Copilot local cache/state on macOS VS Code.
# Usage:
#   ./scripts/cleanup_copilot_cache.sh --dry-run
#   ./scripts/cleanup_copilot_cache.sh --yes

mode="apply"
assume_yes="false"

for arg in "$@"; do
  case "$arg" in
    --dry-run) mode="dry-run" ;;
    --yes) assume_yes="true" ;;
    -h|--help)
      sed -n '1,24p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

code_user_dir="$HOME/Library/Application Support/Code/User"
code_logs_dir="$HOME/Library/Application Support/Code/logs"

# Keep scope narrow to Copilot-owned storage only.
declare -a targets
targets+=("$code_user_dir/globalStorage/github.copilot")
targets+=("$code_user_dir/globalStorage/github.copilot-chat")
targets+=("$code_user_dir/globalStorage/github.copilot-nightly")
targets+=("$code_user_dir/globalStorage/github.copilot-chat-nightly")

if [[ -d "$code_logs_dir" ]]; then
  while IFS= read -r path; do
    targets+=("$path")
  done < <(find "$code_logs_dir" -type d \( -name "GitHub.copilot*" -o -name "github.copilot*" \) 2>/dev/null)
fi

existing=()
for t in "${targets[@]}"; do
  if [[ -e "$t" ]]; then
    existing+=("$t")
  fi
done

if [[ ${#existing[@]} -eq 0 ]]; then
  echo "No Copilot cache targets found."
  exit 0
fi

echo "Cleanup mode: $mode"
echo "Targets to remove:"
for t in "${existing[@]}"; do
  echo " - $t"
done

if [[ "$mode" == "dry-run" ]]; then
  exit 0
fi

if [[ "$assume_yes" != "true" ]]; then
  read -r -p "Proceed to remove these paths? [y/N] " ans
  if [[ ! "$ans" =~ ^[Yy]$ ]]; then
    echo "Canceled."
    exit 0
  fi
fi

for t in "${existing[@]}"; do
  rm -rf "$t"
done

echo "Copilot cache cleanup completed."
