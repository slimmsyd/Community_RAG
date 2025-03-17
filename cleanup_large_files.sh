#!/bin/bash

# This script helps remove large files from Git history
# CAUTION: This will rewrite Git history. Make sure collaborators are aware.

echo "==== Git Large File Cleanup Script ===="
echo "This script will help remove large files from your Git history."
echo "CAUTION: This will rewrite Git history. All collaborators will need to re-clone or reset their repositories."
echo ""
echo "Would you like to proceed? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

# First, identify large files in the repository
echo "Identifying large files in the repository..."
git rev-list --objects --all | grep -f <(git verify-pack -v .git/objects/pack/*.idx | sort -k 3 -n | tail -n 100 | awk '{print $1}') | sort -k 2 > large_files.txt

echo "Top 20 largest files in the repository:"
cat large_files.txt | head -n 20

echo ""
echo "Clean up the following folders and files?"
echo "- Street_App/programs/test-ledger/rocksdb/"
echo "- All .log files in Street_App/programs/test-ledger/"
echo "- validator-*.log files"
echo ""
echo "Proceed? (y/n)"
read -r CONFIRM2

if [ "$CONFIRM2" != "y" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Create a new branch for cleanup
CLEANUP_BRANCH="cleanup-large-files-$(date +%s)"
git checkout -b "$CLEANUP_BRANCH"

# Use git filter-repo to remove the large files
# Note: You need to install git-filter-repo first: pip install git-filter-repo
echo "Removing large files from Git history..."

echo "Removing Street_App/programs/test-ledger/rocksdb/ folder..."
git filter-repo --path Street_App/programs/test-ledger/rocksdb/ --invert-paths

echo "Removing .log files in Street_App/programs/test-ledger/..."
git filter-repo --path-glob 'Street_App/programs/test-ledger/*.log' --invert-paths

echo "Removing validator log files..."
git filter-repo --path-glob 'Street_App/programs/test-ledger/validator-*.log' --invert-paths

echo ""
echo "Cleanup complete on branch $CLEANUP_BRANCH"
echo ""
echo "Next steps:"
echo "1. Verify your repository is still in good condition"
echo "2. Force push this branch to replace your main branch:"
echo "   git push origin $CLEANUP_BRANCH:main --force"
echo ""
echo "3. Have collaborators fetch and reset their repositories:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
echo ""
echo "4. Delete this cleanup branch when done:"
echo "   git branch -D $CLEANUP_BRANCH" 