#!/bin/bash

# Fix duplicate shared imports
echo "🔧 Fixing duplicate shared imports..."

# Find and replace all instances of @/shared/shared with @/shared
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/shared/shared|@/shared|g'

# Find and replace all instances of @shared/shared with @shared
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@shared/shared|@shared|g'

echo "✅ Fixed duplicate shared imports" 