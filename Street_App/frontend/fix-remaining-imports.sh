#!/bin/bash
set -e

# Go to the frontend directory
cd "$(dirname "$0")"

# Find and update files with '../lib/utils' imports (excluding node_modules)
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec grep -l "from '../lib/utils'" {} \; | while read -r file; do
  # Replace '../lib/utils' with '../components/lib/utils'
  sed -i '' -e "s|from '../lib/utils'|from './components/lib/utils'|g" "$file"
  
  echo "Updated $file"
done

echo "Remaining import paths updated successfully!" 