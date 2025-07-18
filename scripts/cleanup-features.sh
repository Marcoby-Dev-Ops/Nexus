#!/usr/bin/env bash
set -euo pipefail

ROOT="./src"
ARCHIVE="$ROOT/archive/features"

mkdir -p "$ARCHIVE"

for feat in ai analytics automation auth chat common core dashboard help integrations onboarding workspace; do
  SRC_FEAT="$ROOT/features/$feat"
  DST=""
  case "$feat" in
    ai)            DST="$ROOT/ai/features" ;;
    analytics)     DST="$ROOT/analytics/features" ;;
    automation)    DST="$ROOT/automation" ;;
    auth)          DST="$ROOT/core/auth" ;;
    chat)          DST="$ROOT/ai/features/chat" ;;
    common)        DST="$ROOT/shared/components/common" ;;
    core)          DST="$ROOT/core" ;;
    dashboard)     DST="$ROOT/domains/dashboard/features" ;;
    help)          DST="$ROOT/help-center" ;;
    integrations)  DST="$ROOT/integrations" ;;
    onboarding)    DST="$ROOT/onboarding" ;;
    workspace)     DST="$ROOT/domains/workspace/features" ;;
  esac

  if [ -d "$SRC_FEAT" ]; then
    echo "🔄 Merging $SRC_FEAT → $DST"
    mkdir -p "$DST"
    rsync -a "$SRC_FEAT/" "$DST/"
    rm -rf "$SRC_FEAT"
  fi
done

# Archive everything else
for leftover in $(find src/features -mindepth 1 -maxdepth 1 -type d); do
  name=$(basename "$leftover")
  echo "📦 Archiving ambiguous feature: $name"
  mkdir -p "$ARCHIVE"
  mv "$leftover" "$ARCHIVE/"
done

echo "✅ Features cleanup done. Review $ARCHIVE for leftovers." 