@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   自定义书签管理系统 - 启动脚本
echo ========================================
echo.

echo [1/4] 检查数据库目录...
if not exist "server\data" mkdir "server\data"
echo ✅ 数据库目录已准备
echo.

echo [2/4] 启动后端服务器...
start "后端服务" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul
echo ✅ 后端服务已启动 (端口: 3001)
echo.

echo [3/4] 启动前端服务...
start "前端服务" cmd /k "cd client && npm run dev"
timeout /t 3 /nobreak > nul
echo ✅ 前端服务已启动 (端口: 5173)
echo.

echo [4/4] 等待服务完全启动...
timeout /t 5 /nobreak > nul
echo.

echo ========================================
echo   ✅ 部署完成！
echo ========================================
echo.
echo 📱 前端访问地址: http://localhost:5173
echo 🔌 后端API地址: http://localhost:3001/api
echo 💚 健康检查: http://localhost:3001/health
echo.
echo 提示:
echo   - 后端服务运行在独立的控制台窗口
echo   - 前端服务运行在独立的控制台窗口
echo   - 关闭对应窗口即可停止服务
echo.
pause
