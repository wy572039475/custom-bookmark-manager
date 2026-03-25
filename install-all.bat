@echo off
chcp 65001 >nul
echo ========================================
echo 快速修复脚本
echo ========================================

echo.
echo 步骤 1/3: 安装项目依赖...
call npm install
if errorlevel 1 (
    echo ❌ 项目依赖安装失败
    pause
    exit /b 1
)
echo ✓ 项目依赖安装完成

echo.
echo 步骤 2/3: 安装前端依赖...
cd client
call npm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo ✓ 前端依赖安装完成
cd ..

echo.
echo 步骤 3/3: 安装后端依赖...
cd server
call npm install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo ✓ 后端依赖安装完成
cd ..

echo.
echo ========================================
echo ✓ 所有依赖安装完成!
echo ========================================
echo.
echo 现在可以运行 start.bat 启动项目
echo 或运行 npm run dev
echo.
pause
