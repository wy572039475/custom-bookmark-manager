#!/bin/sh
# ============================================
# Render 部署启动脚本
# Render Deployment Startup Script
# ============================================

set -e

echo "🚀 Starting Bookmark Server on Render..."
echo "📍 Environment: $NODE_ENV"

# 等待网络就绪
echo "⏳ Waiting for network to be ready..."
sleep 2

# 运行数据库迁移
echo "📦 Running database migrations..."
npm run db:migrate:turso || echo "⚠️ Migration failed, continuing anyway..."

# 启动应用
echo "🌟 Starting application..."
exec node dist/index.js
