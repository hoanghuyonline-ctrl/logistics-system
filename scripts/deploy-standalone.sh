#!/bin/bash
# Deploy standalone Next.js server with static assets
# Usage: bash scripts/deploy-standalone.sh
#
# After running this script, start the server with:
#   node .next/standalone/server.js
# or:
#   pm2 start .next/standalone/server.js --name logistics-system
#
# RECOVERY: If deploy fails mid-way, fix the issue and re-run this script.
# The script is idempotent and safe to re-run.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Nam Trung Hai Logistics - Standalone Deploy${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ── Pre-flight checks ──────────────────────────────────────────────

echo -e "${MAGENTA}[Pre-flight] Checking environment...${NC}"

# Check Node.js
if ! command -v node &>/dev/null; then
    echo -e "${RED}  ERROR: Node.js not found. Install Node.js 18+ first.${NC}"
    exit 1
fi
echo -e "${GRAY}  Node.js: $(node --version)${NC}"

# Check npm
if ! command -v npm &>/dev/null; then
    echo -e "${RED}  ERROR: npm not found.${NC}"
    exit 1
fi
echo -e "${GRAY}  npm:     v$(npm --version)${NC}"

# Check package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}  ERROR: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check public folder exists
if [ ! -d "public" ]; then
    echo -e "${YELLOW}  WARNING: 'public' folder not found. Static assets (favicon, images) will be missing.${NC}"
    echo -e "${YELLOW}  TIP: If you moved or deleted 'public', restore it from git:${NC}"
    echo -e "${YELLOW}       git checkout -- public${NC}"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}  WARNING: .env file not found. The app may not connect to the database.${NC}"
    echo -e "${YELLOW}  TIP: Copy .env.example to .env and fill in DATABASE_URL, NEXTAUTH_SECRET, etc.${NC}"
fi

echo ""

# ── Step 1: Build ──────────────────────────────────────────────────

echo -e "${YELLOW}[1/5] Building Next.js (standalone)...${NC}"
if ! npm run build; then
    echo ""
    echo -e "${RED}BUILD FAILED${NC}"
    echo -e "${YELLOW}Common fixes:${NC}"
    echo -e "${GRAY}  1. Run 'npm install' first${NC}"
    echo -e "${GRAY}  2. Run 'npx prisma generate' if you see Prisma errors${NC}"
    echo -e "${GRAY}  3. Check for TypeScript errors: npm run typecheck${NC}"
    echo -e "${GRAY}  4. Check next.config.ts has: output: 'standalone'${NC}"
    exit 1
fi

# ── Step 2: Validate build output ─────────────────────────────────

echo -e "${YELLOW}[2/5] Validating build output...${NC}"

if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}  ERROR: .next/standalone/server.js not found!${NC}"
    echo -e "${YELLOW}  FIX: Ensure next.config.ts has: output: 'standalone'${NC}"
    echo -e "${YELLOW}  Then re-run: npm run build${NC}"
    exit 1
fi

if [ ! -d ".next/static" ]; then
    echo -e "${RED}  ERROR: .next/static folder not found after build!${NC}"
    echo -e "${YELLOW}  This usually means the build failed silently or was interrupted.${NC}"
    echo -e "${YELLOW}  FIX: Delete .next folder and rebuild:${NC}"
    echo -e "${GRAY}       rm -rf .next${NC}"
    echo -e "${GRAY}       npm run build${NC}"
    exit 1
fi

echo -e "${GREEN}  Build output validated OK${NC}"

# ── Step 3: Copy static assets ────────────────────────────────────

echo -e "${YELLOW}[3/5] Copying .next/static -> .next/standalone/.next/static${NC}"
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static

# Verify copy succeeded
if [ ! -d ".next/standalone/.next/static" ]; then
    echo -e "${RED}  ERROR: Failed to copy static assets!${NC}"
    echo -e "${YELLOW}  TIP: Check disk space and file permissions.${NC}"
    exit 1
fi
echo -e "${GREEN}  Static assets copied OK${NC}"

# ── Step 4: Copy public assets ────────────────────────────────────

echo -e "${YELLOW}[4/5] Copying public -> .next/standalone/public${NC}"
if [ -d "public" ]; then
    rm -rf .next/standalone/public
    cp -r public .next/standalone/public

    if [ ! -d ".next/standalone/public" ]; then
        echo -e "${RED}  ERROR: Failed to copy public folder!${NC}"
        exit 1
    fi
    echo -e "${GREEN}  Public assets copied OK${NC}"
else
    echo -e "${YELLOW}  SKIPPED: No 'public' folder found (non-critical)${NC}"
fi

# ── Step 5: Copy Prisma files ─────────────────────────────────────

echo -e "${YELLOW}[5/5] Copying Prisma files...${NC}"
PRISMA_OK=true

if [ -d "prisma" ]; then
    cp -r prisma .next/standalone/prisma
else
    echo -e "${YELLOW}  WARNING: prisma/ folder not found${NC}"
    PRISMA_OK=false
fi

if [ -f "prisma.config.ts" ]; then
    cp prisma.config.ts .next/standalone/prisma.config.ts
fi

if [ -d "node_modules/.prisma" ]; then
    mkdir -p .next/standalone/node_modules/.prisma
    cp -r node_modules/.prisma/* .next/standalone/node_modules/.prisma/
else
    echo -e "${YELLOW}  WARNING: node_modules/.prisma not found. Run 'npx prisma generate' first.${NC}"
    PRISMA_OK=false
fi

if [ "$PRISMA_OK" = true ]; then
    echo -e "${GREEN}  Prisma files copied OK${NC}"
fi

# ── Final summary ─────────────────────────────────────────────────

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deploy complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}Start server:${NC}"
echo "  node .next/standalone/server.js"
echo ""
echo -e "${CYAN}Or with PM2:${NC}"
echo "  pm2 start .next/standalone/server.js --name logistics-system"
echo "  pm2 save"
echo ""
echo -e "${GRAY}PM2 useful commands:${NC}"
echo -e "${GRAY}  pm2 logs logistics-system    # View logs${NC}"
echo -e "${GRAY}  pm2 restart logistics-system # Restart${NC}"
echo -e "${GRAY}  pm2 stop logistics-system    # Stop${NC}"
echo -e "${GRAY}  pm2 monit                    # Monitor${NC}"
echo ""
echo -e "${GRAY}Troubleshooting:${NC}"
echo -e "${GRAY}  - White screen / missing CSS? Check .next/standalone/.next/static exists${NC}"
echo -e "${GRAY}  - Missing images? Check .next/standalone/public exists${NC}"
echo -e "${GRAY}  - DB errors? Check .env has correct DATABASE_URL${NC}"
echo -e "${GRAY}  - Port in use? PORT=3001 node .next/standalone/server.js${NC}"
echo ""
