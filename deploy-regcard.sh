#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/regcard"
BRANCH="${1:-main}"

echo "🚀 Deploying RegCard from branch: $BRANCH"

cd "$APP_DIR"

echo "📥 Pulling latest changes..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "📦 Installing dependencies..."
npm ci --omit=dev

echo "🗃️  Running database migrations..."
npx prisma migrate deploy

echo "🔨 Building application..."
npm run build

echo "♻️  Restarting PM2..."
pm2 restart ecosystem.config.js --update-env

echo "✅ Deployment complete!"
