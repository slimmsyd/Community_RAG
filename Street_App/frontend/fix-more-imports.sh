#!/bin/bash
set -e

# Go to the frontend directory
cd "$(dirname "$0")"

# Update DashboardSidebar.tsx and navbar.tsx
for file in components/DashboardSidebar.tsx components/navbar.tsx; do
  if [ -f "$file" ]; then
    # Replace "../lib/utils" with "./lib/utils"
    sed -i '' -e "s|from \"../lib/utils\"|from \"./lib/utils\"|g" "$file"
    
    echo "Updated $file"
  fi
done

# Fix any import references to "../../lib/utils" in components/ui directory
for file in components/ui/*.tsx components/ui/*.ts; do
  if [ -f "$file" ]; then
    # Replace "../../lib/utils" with "../lib/utils"
    sed -i '' -e "s|from \"../../lib/utils\"|from \"../lib/utils\"|g" "$file"
    sed -i '' -e "s|from '../../lib/utils'|from '../lib/utils'|g" "$file"
    
    echo "Updated $file"
  fi
done

echo "All import paths updated successfully!" 