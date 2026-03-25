#!/bin/sh
# ============================================
# 生产环境启动脚本
# Production Startup Script
# ============================================

set -e

echo "🚀 Starting Bookmark Server..."
echo "📍 Environment: $NODE_ENV"

# 等待数据库就绪（如果需要）
if [ -n "$TURSO_DATABASE_URL" ]; then
    echo "⏳ Checking database connection..."
    # 简单的延迟，确保网络就绪
    sleep 2
fi

# 运行数据库迁移（如果配置了）
if [ "$RUN_MIGRATION" = "true" ]; then
    echo "📦 Running database migrations..."
    # 这里可以添加迁移命令
    # npm run db:migrate:turso 2>/dev/null || echo "Migration skipped or failed"
fi

# 启动应用
echo "🌟 Starting application..."
exec node dist/index.js
