#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "⚠️  Dry‑run mode — no files will actually change."
fi

# 1. Move index.css
SRC_CSS="src/index.css"
DST_CSS="src/shared/assets/index.css"
if [[ -f "$SRC_CSS" ]]; then
  echo "${DRY_RUN:+[DRYRUN]} Moving $SRC_CSS → $DST_CSS"
  if ! $DRY_RUN; then
    mkdir -p "$(dirname "$DST_CSS")"
    git mv "$SRC_CSS" "$DST_CSS" 2>/dev/null || mv "$SRC_CSS" "$DST_CSS"
  fi
fi

# 2. Rewrite imports of App.tsx, main.tsx, routes.ts
echo
echo "🔧 Updating entry imports..."
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
  # App
  sed_regex="s#\(\(['\"]\)\)\(?:(\.\./)*\)App\.tsx\(['\"]\)#\1\2./app/App.tsx\3#g"
  # main
  sed_regex_main="s#\(\(['\"]\)\)\(?:(\.\./)*\)main\.tsx\(['\"]\)#\1\2./app/main.tsx\3#g"
  # routes → router
  sed_regex_routes="s#\(\(['\"]\)\)\(?:(\.\./)*\)routes\.ts\(['\"]\)#\1\2./app/router.tsx\3#g"

  if grep -qE "App\.tsx|main\.tsx|routes\.ts" "$file"; then
    echo "${DRY_RUN:+[DRYRUN]}   Fixing imports in $file"
    if ! $DRY_RUN; then
      sed -i'' -E "$sed_regex" "$file"
      sed -i'' -E "$sed_regex_main" "$file"
      sed -i'' -E "$sed_regex_routes" "$file"
    fi
  fi
done

echo
echo "✅ ${DRY_RUN:+(dry‑run) }Done! Please restart your IDE/TS server and run your build/tests." 