#!/bin/bash

# Quest Core Deployment Status Checker
# Run this script to check if your deployment was successful

echo "🔍 Quest Core Deployment Status Check"
echo "========================================"
echo ""

# Get latest commit info
COMMIT_SHA=$(git rev-parse HEAD)
SHORT_SHA=${COMMIT_SHA:0:7}
COMMIT_MSG=$(git log -1 --pretty=format:'%s')

echo "📊 Latest Deployment Info:"
echo "  Commit: $SHORT_SHA"
echo "  Message: $COMMIT_MSG"
echo "  Time: $(date)"
echo ""

# Check if build passes locally
echo "🏗️  Running local build check..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Local build passes"
else
    echo "❌ Local build fails - check 'npm run build' output"
    exit 1
fi

echo ""
echo "🎯 Key Features to Test:"
echo "  1. Surface Profile Creation: /profile/setup"
echo "  2. Working Repository: /work/setup" 
echo "  3. Personal Repository: /repo/personal"
echo "  4. Trinity Creation: /trinity/create"
echo "  5. Full Repository View: /repo"
echo ""

echo "🔧 If deployment fails, check:"
echo "  - Vercel build logs"
echo "  - ESLint errors"
echo "  - TypeScript errors"
echo "  - Missing environment variables"
echo "  - Database connection issues"
echo ""

echo "✅ Deployment check completed!"
echo "🚀 Visit your Vercel dashboard to confirm deployment status"