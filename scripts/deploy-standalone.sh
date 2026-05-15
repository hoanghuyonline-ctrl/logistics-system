#!/bin/bash
# Deploy standalone Next.js server with static assets
# Usage: bash scripts/deploy-standalone.sh
#
# After running this script, start the server with:
#   node .next/standalone/server.js
# or:
#   pm2 start .next/standalone/server.js --name logistics-system

set -e

echo "=== Standalone Deploy ==="

# 1. Build
echo "[1/4] Building Next.js..."
npm run build

# 2. Copy static assets into standalone output
echo "[2/4] Copying .next/static → .next/standalone/.next/static"
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static

# 3. Copy public assets into standalone output
echo "[3/4] Copying public → .next/standalone/public"
rm -rf .next/standalone/public
cp -r public .next/standalone/public

# 4. Copy Prisma files
echo "[4/4] Copying Prisma files..."
cp -r prisma .next/standalone/prisma 2>/dev/null || true
cp prisma.config.ts .next/standalone/prisma.config.ts 2>/dev/null || true
mkdir -p .next/standalone/node_modules/.prisma
cp -r node_modules/.prisma/* .next/standalone/node_modules/.prisma/ 2>/dev/null || true

echo ""
echo "=== Deploy complete ==="
echo "Start server:"
echo "  node .next/standalone/server.js"
echo "  # or"
echo "  pm2 start .next/standalone/server.js --name logistics-system"
