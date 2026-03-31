#!/bin/bash

echo "================================"
echo "🔍 Excalidraw AI 集成 - 服务状态检查"
echo "================================"
echo ""

# 1. 检查后端服务
echo "📊 后端服务 (端口 3016):"
if curl -s http://localhost:3016/health > /dev/null 2>&1; then
    echo "   ✅ 运行中"
    echo "   📍 http://localhost:3016"
    echo "   🧠 模型: GLM-4.7"
else
    echo "   ❌ 未运行"
    echo "   💡 启动: cd excalidraw-ai-backend && npm run dev"
fi
echo ""

# 2. 检查前端服务
echo "📊 前端服务 (端口 3001):"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ 运行中"
    echo "   📍 http://localhost:3001"
else
    echo "   ⏳ 启动中..."
    echo "   💡 请稍等片刻，Vite 服务器正在启动"
fi
echo ""

# 3. 测试 API 连接
echo "🧪 API 测试:"
if curl -s http://localhost:3016/health > /dev/null 2>&1; then
    echo "   ✅ 后端 API 可用"
    echo ""
    echo "   测试命令:"
    echo "   curl -X POST http://localhost:3016/v1/ai/text-to-diagram/chat-streaming \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"messages\":[{\"role\":\"user\",\"content\":\"测试\"}]}'"
else
    echo "   ⚠️  后端 API 不可用"
fi
echo ""

# 4. 显示快速链接
echo "================================"
echo "🔗 快速链接"
echo "================================"
echo ""
echo "1. 测试页面:"
echo "   start excalidraw-ai-backend/test-integration.html"
echo ""
echo "2. Excalidraw 前端:"
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ http://localhost:3001"
else
    echo "   ⏳ 等待服务器启动后访问 http://localhost:3001"
fi
echo ""
echo "3. 智谱 AI 控制台:"
echo "   https://open.bigmodel.cn/"
echo ""
echo "================================"
echo ""
echo "💡 提示: 如果遇到速率限制，请等待 1-2 分钟后重试"
echo "================================"
