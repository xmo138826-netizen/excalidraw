#!/bin/bash

# Excalidraw AI 后端 - 快速启动脚本

echo "================================"
echo "🚀 Excalidraw AI 后端服务"
echo "================================"
echo ""

# 检查后端服务状态
echo "📊 检查后端服务状态..."
if curl -s http://localhost:3016/health > /dev/null 2>&1; then
    echo "✅ 后端服务正在运行"
    echo "📍 地址: http://localhost:3016"
    echo ""
else
    echo "❌ 后端服务未运行"
    echo "💡 启动命令: cd excalidraw-ai-backend && npm run dev"
    echo ""
fi

# 测试 API
echo "🧪 测试 API 连接..."
echo "提示词: '创建一个简单的思维导图'"
echo ""

curl -N -X POST http://localhost:3016/v1/ai/text-to-diagram/chat-streaming \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"简单测试"}]}' \
  --max-time 10 2>&1 | grep "data:" | head -10

echo ""
echo "================================"
echo "📖 快速指南"
echo "================================"
echo ""
echo "1. 测试页面:"
echo "   start excalidraw-ai-backend/test-integration.html"
echo ""
echo "2. 启动前端:"
echo "   cd excalidraw-app"
echo "   npm start"
echo ""
echo "3. 访问 Excalidraw:"
echo "   http://localhost:3001"
echo ""
echo "4. 使用 AI 功能:"
echo "   点击 AI 图标 → 输入主题 → 生成思维导图"
echo ""
echo "================================"
