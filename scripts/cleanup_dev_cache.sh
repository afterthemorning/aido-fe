#!/usr/bin/env bash
set -euo pipefail

# Cleanup cache/build artifacts for faster local dev without touching source/data.
# Usage:
#   ./scripts/cleanup_dev_cache.sh --dry-run
#   ./scripts/cleanup_dev_cache.sh --yes
#   ./scripts/cleanup_dev_cache.sh --deep --yes

repo_root="$(git rev-parse --show-toplevel)"
fe_root="$repo_root"
be_root="$(cd "$repo_root/../aido" 2>/dev/null && pwd || true)"

mode="apply"
assume_yes="false"
deep="false"

for arg in "$@"; do
  case "$arg" in
    --dry-run) mode="dry-run" ;;
    --yes) assume_yes="true" ;;
    --deep) deep="true" ;;
    -h|--help)
      sed -n '1,20p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

declare -a targets

# Frontend cache targets
targets+=("$fe_root/.cache")
targets+=("$fe_root/.npm-cache")
targets+=("$fe_root/node_modules/.cache")
targets+=("$fe_root/node_modules/.vite")
targets+=("$fe_root/tmp-console-scan.json")
targets+=("$fe_root/tmp-external-scan.json")
targets+=("$fe_root/tmp-route-page-scan.json")

# Backend cache targets (only if sibling repo exists)
if [[ -n "$be_root" && -d "$be_root" ]]; then
  targets+=("$be_root/.tmp")
  targets+=("$be_root/tmp")
  targets+=("$be_root/dist")
  targets+=("$be_root/.aido-deploy-cache")
fi

if [[ "$deep" == "true" ]]; then
  targets+=("$fe_root/node_modules")
fi

existing=()
for t in "${targets[@]}"; do
  if [[ -e "$t" ]]; then
    existing+=("$t")
  fi
done

if [[ ${#existing[@]} -eq 0 ]]; then
  echo "No cache targets found."
  exit 0
fi

echo "Cleanup mode: $mode"
echo "Deep cleanup: $deep"
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

echo "Cleanup completed."
