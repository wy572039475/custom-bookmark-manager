@echo off
chcp 65001 >nul
echo ========================================
echo    PostgreSQL 数据库配置脚本
echo ========================================
echo.

REM 设置数据库密码（请修改为你的实际密码）
set DB_PASSWORD=postgres

echo 正在创建数据库...
echo 请输入 postgres 用户的密码（安装时设置的密码）：
psql -U postgres -c "CREATE DATABASE bookmark_db;"

echo.
echo 正在运行数据库迁移...
cd server
call npm run db:migrate

echo.
echo ========================================
echo 配置完成！
echo 请确保 server\.env 文件中的 DB_PASSWORD 已设置正确
echo ========================================
pause
