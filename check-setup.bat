@echo off
echo ========================================
echo 启动诊断工具
echo ========================================

echo.
echo [1] 检查 Node.js 版本...
node --version
if errorlevel 1 (
    echo ❌ Node.js 未安装或不在 PATH 中
    pause
    exit /b 1
)
echo ✓ Node.js 已安装

echo.
echo [2] 检查 npm 版本...
npm --version
if errorlevel 1 (
    echo ❌ npm 未安装
    pause
    exit /b 1
)
echo ✓ npm 已安装

echo.
echo [3] 检查项目依赖...
if not exist "node_modules" (
    echo ❌ 项目未安装依赖
    echo.
    echo 正在安装项目依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ 依赖安装成功
) else (
    echo ✓ 依赖已安装
)

echo.
echo [4] 检查前端依赖...
cd client
if not exist "node_modules" (
    echo ❌ 前端依赖未安装
    echo.
    echo 正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo ✓ 前端依赖安装成功
) else (
    echo ✓ 前端依赖已安装
)
cd ..

echo.
echo [5] 检查后端依赖...
cd server
if not exist "node_modules" (
    echo ❌ 后端依赖未安装
    echo.
    echo 正在安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo ✓ 后端依赖安装成功
) else (
    echo ✓ 后端依赖已安装
)
cd ..

echo.
echo ========================================
echo 诊断完成!
echo ========================================
echo.
echo 所有依赖已就绪,现在可以启动项目了:
echo   方式1: 运行 npm run dev (同时启动前后端)
echo   方式2: 分别启动前端和后端
echo.
pause
