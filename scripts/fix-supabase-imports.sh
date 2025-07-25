#!/bin/bash

# Fix all supabase imports to point to the correct location
echo "🔧 Fixing supabase imports..."

# Find all TypeScript and TSX files that import from @/core/lib/supabase
files=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "@/core/lib/supabase" 2>/dev/null)

if [ -z "$files" ]; then
    echo "✅ No files found with @/core/lib/supabase imports"
    exit 0
fi

echo "📁 Found $(echo "$files" | wc -l) files to update"

# Replace the imports
for file in $files; do
    echo "  Updating $file"
    sed -i 's|@/core/lib/supabase|@/lib/supabase|g' "$file"
done

echo "✅ Updated all supabase imports" 