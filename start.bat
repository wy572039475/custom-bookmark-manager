@echo off
echo ========================================
echo 启动开发服务器
echo ========================================

echo.
echo 正在启动后端服务器...
start "Bookmark Server" cmd /k "cd server && npm run dev"

echo.
echo 等待后端启动...
timeout /t 3 /nobreak >nul

echo.
echo 正在启动前端服务器...
start "Bookmark Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo 项目已启动!
echo ========================================
echo.
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3000
echo.
echo 按任意键关闭此窗口...
pause >nul
