#!/bin/bash
# MyAiMediaManager Deployment Fix Script
# Purpose: Fix database tier constraint violations and ensure successful deployment

echo "🚀 Starting deployment fix for MyAiMediaManager"
echo "============================================"

# Run the emergency tier fix migration first
echo ""
echo "1️⃣ Running emergency tier fix migration..."
echo "-------------------------------------------"
tsx server/migration-runner.ts

if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Stopping deployment."
    exit 1
fi

echo ""
echo "2️⃣ Building application..."
echo "-------------------------------------------"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Stopping deployment."
    exit 1
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "3️⃣ Next steps:"
echo "  1. Commit these changes to git"
echo "  2. Push to your repository"
echo "  3. Render will automatically deploy"
echo ""
echo "Files created/modified:"
echo "  - migrations/0000_emergency_tier_fix.sql (NEW)"
echo "  - server/migration-runner.ts (NEW)"
echo "  - deploy-fix.sh (THIS FILE)"
echo ""