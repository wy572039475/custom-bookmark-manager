@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   推送代码到 GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo 📝 检查 Git 仓库状态...
if not exist .git (
    echo.
    echo ⚠️  Git 仓库未初始化
    echo.
    echo [1] 初始化 Git 仓库并推送
    echo [2] 退出
    echo.
    set /p choice="请选择操作 (1/2): "

    if "%choice%"=="1" (
        echo.
        echo 🔄 初始化 Git 仓库...
        git init

        echo 📦 添加所有文件...
        git add .

        echo 💾 创建首次提交...
        git commit -m "Initial commit - Ready for Render deployment"

        echo.
        echo ========================================
        echo   🔗 添加 GitHub 远程仓库
        echo ========================================
        echo.
        echo 请按照以下步骤操作：
        echo.
        echo 1. 在浏览器访问: https://github.com/new
        echo 2. 创建新仓库: custom-bookmark-system
        echo 3. 不初始化 README（选择 Skip）
        echo 4. 创建后复制仓库地址
        echo.
        set /p repo_url="请输入 GitHub 仓库地址: "

        git remote add origin %repo_url%

        echo.
        echo 📤 推送代码到 GitHub...
        git branch -M main
        git push -u origin main

        echo.
        echo ✅ 代码推送成功！
        echo.
        echo 📋 下一步：
        echo   1. 访问 https://dashboard.render.com
        echo   2. 按照 DEPLOY-RENDER-GUIDE.md 部署
        echo.
    ) else (
        echo.
        echo 退出...
    )
) else (
    echo ✅ Git 仓库已存在
    echo.
    echo 📦 添加所有文件...
    git add .

    echo 💾 创建提交...
    git commit -m "Update for Render deployment"

    echo 📤 推送代码到 GitHub...
    git push

    echo.
    echo ✅ 代码推送成功！
    echo.
)

echo.
echo ========================================
echo   📚 相关文档
echo ========================================
echo.
echo • 详细部署指南: DEPLOY-RENDER-GUIDE.md
echo • Render 配置说明: RENDER-DEPLOYMENT.md
echo.
pause
