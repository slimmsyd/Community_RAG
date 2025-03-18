#!/bin/bash
set -e

# Go to the components directory
cd "$(dirname "$0")/components/ui"

# Loop through all TypeScript and TSX files
for file in *.tsx *.ts; do
  # Skip if file doesn't exist
  [ -f "$file" ] || continue
  
  # Replace '@/lib/utils' with '../../app/lib/utils'
  sed -i '' -e "s|from '@/lib/utils'|from '../../app/lib/utils'|g" "$file"
  
  echo "Updated $file"
done

echo "Import paths updated successfully!" 