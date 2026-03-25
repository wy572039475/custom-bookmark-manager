@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   迁移到 Turso 生产数据库
echo ========================================
echo.

cd server

echo 📊 数据库 URL: libsql://bookmark-db-wy572039475.aws-ap-northeast-1.turso.io
echo 🔑 Token: 已配置
echo.

echo ⏳ 开始数据库迁移...
npm run db:migrate:turso

echo.
echo ✅ 数据库迁移完成！
echo.
pause
