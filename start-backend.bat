@echo off
chcp 65001 >nul
echo.
echo ================================================
echo   🚀 Excalidraw AI 后端服务 - 快速启动
echo ================================================
echo.

cd /d "%~dp0excalidraw-ai-backend"

echo [1/3] 检查环境...
if not exist ".env" (
    echo ❌ 错误: 找不到 .env 文件
    echo 请先复制 .env.example 为 .env 并配置 API Key
    pause
    exit /b 1
)

echo [2/3] 编译 TypeScript 代码...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 编译失败
    pause
    exit /b 1
)

echo [3/3] 启动后端服务...
echo.
echo ✅ 服务启动成功！
echo.
echo 📡 API 地址: http://localhost:3016
echo 🏥 健康检查: http://localhost:3016/health
echo.
echo 💡 提示: 按 Ctrl+C 停止服务
echo ================================================
echo.

call npm start
