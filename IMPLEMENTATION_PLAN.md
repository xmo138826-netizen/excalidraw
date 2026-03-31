# 完整实现方案：AI 思维导图 + 赛博科技风格 UI

## 项目概述

基于 Excalidraw 现有架构，实现以下功能：
1. **AI 生成思维导图功能** - 使用 OpenRouter API 集成
2. **赛博科技风格 UI** - 更改整个项目界面风格
3. **Legend 元素** - 在页面上增加明显的图例显示
4. **前端实现** - 只需编写前端代码，预留后端接口调用

---

## 一、AI 生成思维导图功能实现

### 1.1 架构设计

#### 核心组件结构
```
packages/excalidraw/components/MindMapDialog/
├── MindMapDialog.tsx           # 主对话框组件
├── MindMapGenerator.tsx        # 思维导图生成器
├── MindMapPreview.tsx          # 预览组件
├── hooks/
│   ├── useMindMapGeneration.ts # 生成 Hook
│   └── useOpenRouter.ts        # OpenRouter API Hook
├── utils/
│   ├── OpenRouterStreamFetch.ts # OpenRouter 流式调用
│   ├── MindMapParser.ts        # 思维导图解析
│   └── MindMapToExcalidraw.ts  # 转换为 Excalidraw 元素
├── types.ts                    # 类型定义
└── MindMapDialog.scss          # 样式
```

### 1.2 数据结构设计

#### 思维导图节点类型
```typescript
// types.ts
interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  position?: { x: number; y: number };
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
  };
}

interface MindMapData {
  root: MindMapNode;
  layout: "horizontal" | "vertical" | "radial";
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MindMapGenerationOptions {
  topic: string;
  depth?: number;
  breadth?: number;
  layout?: "horizontal" | "vertical" | "radial";
  style?: "professional" | "creative" | "minimal";
}
```

### 1.3 OpenRouter API 集成

#### API 调用实现
```typescript
// utils/OpenRouterStreamFetch.ts
interface OpenRouterConfig {
  apiKey: string; // 从环境变量或用户配置获取
  baseURL: string; // https://openrouter.ai/api/v1
  model: string; // 默认: "anthropic/claude-3.5-sonnet"
}

export async function OpenRouterStreamFetch(
  options: {
    messages: OpenRouterMessage[];
    onChunk: (chunk: string) => void;
    signal: AbortSignal;
  } & OpenRouterConfig
): Promise<{ generatedResponse: string; error: Error | null }> {
  
  const response = await fetch(`${options.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href,
      "X-Title": "Excalidraw Mind Map Generator",
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
    signal: options.signal,
  });

  // 流式响应处理（参考 TTDStreamFetch.ts）
  // ...
}
```

#### Prompt 模板
```typescript
// utils/MindMapParser.ts
const MINDMAP_SYSTEM_PROMPT = `You are a mind map generation expert. 
Given a topic, generate a structured mind map in JSON format.

Requirements:
- Return valid JSON only, no markdown
- Root node should be the main topic
- Maximum 3-4 levels deep
- Each node should have 2-5 children
- Keep text concise (3-8 words per node)

Response format:
{
  "root": {
    "id": "root",
    "text": "Main Topic",
    "level": 0,
    "children": [
      {
        "id": "node-1",
        "text": "Subtopic 1",
        "level": 1,
        "children": []
      }
    ]
  },
  "layout": "horizontal"
}`;
```

### 1.4 思维导图渲染

#### 转换为 Excalidraw 元素
```typescript
// utils/MindMapToExcalidraw.ts
import { newElement, newTextElement, newLinearElement } from "@excalidraw/element";

export function MindMapToExcalidraw(
  mindMap: MindMapData,
  appState: AppState
): NonDeletedExcalidrawElement[] {
  
  const elements: NonDeletedExcalidrawElement[] = [];
  const NODE_WIDTH = 160;
  const NODE_HEIGHT = 60;
  const LEVEL_GAP = 200;
  const SIBLING_GAP = 80;

  // 1. 计算节点位置（树形布局算法）
  const nodePositions = calculateNodePositions(mindMap.root, {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    levelGap: LEVEL_GAP,
    siblingGap: SIBLING_GAP,
    layout: mindMap.layout,
  });

  // 2. 创建节点元素（矩形 + 文本）
  Object.entries(nodePositions).forEach(([nodeId, pos]) => {
    const node = findNodeById(mindMap.root, nodeId);
    
    // 创建矩形背景
    const rect = newElement({
      type: "rectangle",
      x: pos.x,
      y: pos.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      strokeColor: "#000",
      backgroundColor: getLevelColor(node.level),
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 0,
      opacity: 100,
    });
    elements.push(rect);

    // 创建文本元素
    const text = newTextElement({
      x: pos.x + 10,
      y: pos.y + 15,
      text: node.text,
      fontSize: getLevelFontSize(node.level),
      fontFamily: 1, // Virgil
      textAlign: "left",
      verticalAlign: "top",
    });
    elements.push(text);
  });

  // 3. 创建连接线（箭头）
  const connections = createConnections(mindMap.root, nodePositions);
  elements.push(...connections);

  return elements;
}

function calculateNodePositions(
  root: MindMapNode,
  config: LayoutConfig
): Record<string, { x: number; y: number }> {
  // 实现树形布局算法
  // 参考 Reingold-Tilford 算法
  // ...
}

function createConnections(
  root: MindMapNode,
  positions: Record<string, { x: number; y: number }>
): ExcalidrawElement[] {
  const arrows: ExcalidrawElement[] = [];
  
  function traverse(node: MindMapNode) {
    node.children.forEach(child => {
      const startPos = positions[node.id];
      const endPos = positions[child.id];
      
      // 创建贝塞尔曲线或直线箭头
      const arrow = newLinearElement({
        type: "arrow",
        x: startPos.x + config.width / 2,
        y: startPos.y + config.height / 2,
        points: [
          [0, 0],
          [endPos.x - startPos.x, endPos.y - startPos.y],
        ],
        strokeColor: "#000",
        strokeWidth: 2,
        roughness: 0,
      });
      
      arrows.push(arrow);
      traverse(child);
    });
  }
  
  traverse(root);
  return arrows;
}
```

### 1.5 用户交互流程

```
用户输入主题
    ↓
点击 "Generate Mind Map" 按钮
    ↓
显示加载动画 + 流式显示生成状态
    ↓
解析 AI 返回的 JSON
    ↓
转换为 Excalidraw 元素
    ↓
在预览区显示思维导图
    ↓
用户可以：
  - 重新生成
  - 调整布局（水平/垂直/径向）
  - 编辑节点文本
  - 点击 "Insert to Canvas" 插入到画布
```

### 1.6 状态管理

```typescript
// hooks/useMindMapGeneration.ts
import { atom, useAtom } from "jotai";

export const mindMapAtom = atom<MindMapData | null>(null);
export const mindMapElementsAtom = atom<NonDeletedExcalidrawElement[]>([]);
export const isGeneratingAtom = atom(false);
export const generationErrorAtom = atom<Error | null>(null);
export const openRouterConfigAtom = atom<OpenRouterConfig>({
  apiKey: "", // 用户需要配置
  baseURL: "https://openrouter.ai/api/v1",
  model: "anthropic/claude-3.5-sonnet",
});

export function useMindMapGeneration() {
  const [mindMap, setMindMap] = useAtom(mindMapAtom);
  const [elements, setElements] = useAtom(mindMapElementsAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [error, setError] = useAtom(generationErrorAtom);
  const [config] = useAtom(openRouterConfigAtom);

  const generate = async (options: MindMapGenerationOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. 构建消息
      const messages: OpenRouterMessage[] = [
        {
          role: "system",
          content: MINDMAP_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Generate a mind map for: ${options.topic}`,
        },
      ];

      // 2. 调用 OpenRouter API
      const abortController = new AbortController();
      let fullResponse = "";

      const result = await OpenRouterStreamFetch({
        ...config,
        messages,
        onChunk: (chunk) => {
          fullResponse += chunk;
          // 可以显示生成进度
        },
        signal: abortController.signal,
      });

      if (result.error) throw result.error;

      // 3. 解析响应
      const parsed = JSON.parse(result.generatedResponse);
      setMindMap(parsed);

      // 4. 转换为 Excalidraw 元素
      const excalidrawElements = MindMapToExcalidraw(parsed, appState);
      setElements(excalidrawElements);

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const insertToCanvas = () => {
    // 调用 App API 插入元素到画布
    // ...
  };

  return {
    generate,
    insertToCanvas,
    mindMap,
    elements,
    isGenerating,
    error,
  };
}
```

### 1.7 Action 注册

```typescript
// actions/actionMindMap.ts
import { register } from "./register";

export const actionToggleMindMapDialog = register({
  name: "toggleMindMapDialog",
  trackEvent: { category: "ai" },
  label: "action.mindMap",
  perform: (elements, appState, _, app) => {
    const nextOpenDialog = appState.openDialog?.name === "mindmap"
      ? null
      : { name: "mindmap" as const, tab: "mindmap" };

    return {
      elements,
      appState: {
        ...appState,
        openDialog: nextOpenDialog,
      },
    };
  },
});
```

---

## 二、赛博科技风格 UI 实现

### 2.1 主题系统扩展

#### 新增主题文件
```scss
// packages/excalidraw/css/theme-cyberpunk.scss
@use "sass:color";
@use "./variables.module" as *;

.excalidraw {
  &.theme--cyberpunk {
    // 主色调：霓虹紫、青色、品红
    --color-primary: #b026ff;
    --color-primary-hover: #c94dff;
    --color-primary-light: #2a0033;
    
    --color-accent: #00ffff;
    --color-accent-glow: rgba(0, 255, 255, 0.3);
    
    --color-secondary: #ff00ff;
    --color-secondary-glow: rgba(255, 0, 255, 0.3);
    
    // 背景色
    --default-bg-color: #0a0a0f;
    --island-bg-color: rgba(20, 20, 30, 0.85);
    --island-bg-color-alt: rgba(30, 30, 45, 0.9);
    
    // 边框和分隔线
    --default-border-color: #3a3a5a;
    --dialog-border-color: #b026ff;
    
    // 文字颜色
    --text-primary-color: #e0e0ff;
    --color-on-surface: #c0c0e0;
    
    // 霓虹效果
    --neon-glow-primary: 0 0 10px var(--color-primary),
                       0 0 20px var(--color-primary),
                       0 0 40px var(--color-primary);
    
    --neon-glow-accent: 0 0 10px var(--color-accent),
                      0 0 20px var(--color-accent);
    
    // 网格背景
    --grid-color: rgba(176, 38, 255, 0.1);
    --grid-size: 20px;
    
    // 阴影效果
    --shadow-island: 0 0 20px rgba(176, 38, 255, 0.3),
                     0 0 40px rgba(0, 255, 255, 0.1);
    
    --shadow-neon: 0 0 5px var(--color-primary),
                  0 0 10px var(--color-accent);
    
    // 按钮样式
    --button-bg: rgba(176, 38, 255, 0.2);
    --button-border: #b026ff;
    --button-hover-bg: rgba(176, 38, 255, 0.4);
    --button-active-bg: rgba(176, 38, 255, 0.6);
    
    // 动画
    --animation-glow: glow-pulse 2s ease-in-out infinite;
    --animation-scanline: scanline 8s linear infinite;
  }
}

// 霓虹动画
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 5px var(--color-primary),
                0 0 10px var(--color-primary);
  }
  50% {
    box-shadow: 0 0 10px var(--color-primary),
                0 0 20px var(--color-primary),
                0 0 30px var(--color-primary);
  }
}

@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100vh);
  }
}

// 网格背景类
.cyberpunk-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

// 扫描线效果
.cyberpunk-scanline {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--color-accent),
    transparent
  );
  opacity: 0.3;
  animation: var(--animation-scanline);
  pointer-events: none;
  z-index: 1;
}

// 霓虹边框效果
.cyberpunk-border {
  border: 1px solid var(--color-primary);
  box-shadow: var(--neon-glow-primary);
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      45deg,
      var(--color-primary),
      var(--color-accent),
      var(--color-secondary),
      var(--color-primary)
    );
    border-radius: inherit;
    z-index: -1;
    opacity: 0.5;
    filter: blur(4px);
  }
}
```

### 2.2 组件样式修改

#### 需要修改的关键样式文件

1. **工具栏样式**
```scss
// packages/excalidraw/components/Toolbar.scss
.excalidraw.theme--cyberpunk {
  .toolbar-container {
    background: rgba(10, 10, 15, 0.95);
    border: 1px solid var(--color-primary);
    box-shadow: var(--neon-glow-primary);
    backdrop-filter: blur(10px);
  }
  
  .ToolIcon {
    &__icon {
      border: 1px solid transparent;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--color-accent);
        box-shadow: var(--neon-glow-accent);
        transform: scale(1.05);
      }
      
      &.active {
        background: var(--button-bg);
        border-color: var(--color-primary);
        box-shadow: var(--neon-glow-primary);
      }
    }
  }
}
```

2. **对话框样式**
```scss
// packages/excalidraw/components/Dialog.scss
.excalidraw.theme--cyberpunk {
  .Dialog {
    background: rgba(20, 20, 30, 0.95);
    border: 2px solid var(--color-primary);
    box-shadow: var(--neon-glow-primary), var(--shadow-island);
    backdrop-filter: blur(20px);
    
    &__title {
      color: var(--color-accent);
      text-shadow: var(--neon-glow-accent);
      font-weight: 600;
      letter-spacing: 1px;
    }
    
    &__close {
      color: var(--color-primary);
      
      &:hover {
        color: var(--color-accent);
        box-shadow: var(--neon-glow-accent);
      }
    }
  }
}
```

3. **按钮样式**
```scss
// packages/excalidraw/components/Button.scss
.excalidraw.theme--cyberpunk {
  .button {
    background: linear-gradient(
      135deg,
      rgba(176, 38, 255, 0.3),
      rgba(0, 255, 255, 0.2)
    );
    border: 1px solid var(--color-primary);
    color: var(--text-primary-color);
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      transition: left 0.5s;
    }
    
    &:hover {
      border-color: var(--color-accent);
      box-shadow: var(--neon-glow-accent);
      
      &::before {
        left: 100%;
      }
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}
```

### 2.3 Legend 组件实现

#### Legend 组件结构
```typescript
// packages/excalidraw/components/Legend/Legend.tsx
import React from "react";
import "./Legend.scss";

interface LegendItem {
  id: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
  description?: string;
}

interface LegendProps {
  items: LegendItem[];
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  collapsible?: boolean;
  title?: string;
}

export const Legend: React.FC<LegendProps> = ({
  items,
  position = "bottom-right",
  collapsible = true,
  title = "Legend",
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={`legend legend--${position} ${isCollapsed ? "legend--collapsed" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {collapsible && (
        <button
          className="legend__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle legend"
        >
          <span className={`legend__toggle-icon ${isCollapsed ? "rotated" : ""}`}>
            ▼
          </span>
        </button>
      )}
      
      {!isCollapsed && (
        <div className="legend__content">
          {title && <h3 className="legend__title">{title}</h3>}
          <ul className="legend__items">
            {items.map((item) => (
              <li key={item.id} className="legend__item">
                <div
                  className="legend__item-color"
                  style={{ backgroundColor: item.color }}
                />
                <div className="legend__item-info">
                  <span className="legend__item-label">{item.label}</span>
                  {item.description && (
                    <span className="legend__item-description">
                      {item.description}
                    </span>
                  )}
                </div>
                {item.icon && (
                  <div className="legend__item-icon">{item.icon}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

#### Legend 样式
```scss
// packages/excalidraw/components/Legend/Legend.scss
@use "../../css/variables.module" as *;

.legend {
  position: fixed;
  z-index: 1000;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: var(--neon-glow-primary);
  transition: all 0.3s ease;
  max-width: 300px;
  
  &--top-left {
    top: 80px;
    left: 20px;
  }
  
  &--top-right {
    top: 80px;
    right: 20px;
  }
  
  &--bottom-left {
    bottom: 20px;
    left: 20px;
  }
  
  &--bottom-right {
    bottom: 20px;
    right: 20px;
  }
  
  &--collapsed {
    width: 40px;
    height: 40px;
    padding: 0;
    overflow: hidden;
  }
  
  &__toggle {
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    padding: 4px;
    
    &:hover {
      color: var(--color-accent);
    }
  }
  
  &__toggle-icon {
    display: block;
    transition: transform 0.3s ease;
    
    &.rotated {
      transform: rotate(-90deg);
    }
  }
  
  &__title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: var(--neon-glow-accent);
  }
  
  &__items {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  &__item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(176, 38, 255, 0.2);
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  &__item-color {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    margin-right: 12px;
    border: 1px solid var(--color-primary);
    box-shadow: 0 0 5px var(--color-primary);
  }
  
  &__item-info {
    flex: 1;
  }
  
  &__item-label {
    display: block;
    font-size: 13px;
    color: var(--text-primary-color);
    font-weight: 500;
  }
  
  &__item-description {
    display: block;
    font-size: 11px;
    color: var(--color-muted);
    margin-top: 2px;
  }
  
  &__item-icon {
    margin-left: 8px;
    color: var(--color-accent);
  }
}

// 赛博朋克主题特有样式
.excalidraw.theme--cyberpunk {
  .legend {
    background: linear-gradient(
      135deg,
      rgba(20, 20, 30, 0.95),
      rgba(30, 30, 45, 0.95)
    );
    
    &::before {
      content: "";
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(
        45deg,
        var(--color-primary),
        var(--color-accent),
        var(--color-secondary),
        var(--color-primary)
      );
      border-radius: inherit;
      z-index: -1;
      opacity: 0.3;
      filter: blur(8px);
      animation: glow-pulse 3s ease-in-out infinite;
    }
    
    &:hover {
      border-color: var(--color-accent);
      box-shadow: var(--neon-glow-accent);
    }
  }
}
```

### 2.4 全局背景效果

#### 在 App 组件中添加背景
```typescript
// packages/excalidraw/components/App.tsx
<div className={`excalidraw theme--${theme}`}>
  {/* 赛博朋克背景 */}
  {theme === "cyberpunk" && (
    <>
      <div className="cyberpunk-grid" />
      <div className="cyberpunk-scanline" />
    </>
  )}
  
  {/* 现有内容 */}
  {/* ... */}
</div>
```

---

## 三、实现优先级和步骤

### 阶段 1：基础架构搭建（1-2天）

**优先级：P0（必须先完成）**

1. **创建 MindMapDialog 基础结构**
   - [ ] 创建目录结构
   - [ ] 实现 MindMapDialog.tsx 基础组件
   - [ ] 注册 Tunnel（在 tunnels.ts 中添加 MindMapDialogTunnel）
   - [ ] 创建 Action（actionMindMap.ts）
   - [ ] 在工具栏添加按钮

2. **OpenRouter API 集成**
   - [ ] 实现 OpenRouterStreamFetch.ts
   - [ ] 创建配置管理（API Key 输入）
   - [ ] 实现基础的消息发送和接收
   - [ ] 添加错误处理

3. **类型定义**
   - [ ] 定义所有 TypeScript 类型
   - [ ] 创建 MindMapData 接口
   - [ ] 定义 API 响应类型

**依赖关系：**
- 思维导图功能依赖基础架构
- UI 主题可以并行开发

---

### 阶段 2：核心功能实现（3-4天）

**优先级：P0**

1. **思维导图生成逻辑**
   - [ ] 实现 Prompt 模板
   - [ ] 实现 MindMapParser（解析 AI 响应）
   - [ ] 实现 useMindMapGeneration Hook
   - [ ] 添加生成状态管理

2. **思维导图渲染**
   - [ ] 实现 MindMapToExcalidraw（转换函数）
   - [ ] 实现树形布局算法
   - [ ] 创建节点元素（矩形 + 文本）
   - [ ] 创建连接线（箭头）
   - [ ] 实现预览组件

3. **用户交互**
   - [ ] 实现主题输入界面
   - [ ] 添加生成按钮和加载状态
   - [ ] 实现重新生成功能
   - [ ] 实现"插入到画布"功能

**依赖关系：**
- 依赖阶段 1 的基础架构
- 可以和主题系统并行开发

---

### 阶段 3：赛博朋克主题系统（2-3天）

**优先级：P1**

1. **主题基础**
   - [ ] 创建 theme-cyberpunk.scss
   - [ ] 定义所有 CSS 变量
   - [ ] 添加主题切换逻辑
   - [ ] 在主题选择器中添加"赛博朋克"选项

2. **背景效果**
   - [ ] 实现网格背景
   - [ ] 实现扫描线动画
   - [ ] 添加霓虹发光效果
   - [ ] 优化性能（使用 CSS transform）

3. **组件样式修改**
   - [ ] 修改 Toolbar 样式
   - [ ] 修改 Dialog 样式
   - [ ] 修改 Button 样式
   - [ ] 修改 Island 样式
   - [ ] 修改其他常用组件

**依赖关系：**
- 可以和阶段 2 并行开发
- 不依赖思维导图功能

---

### 阶段 4：Legend 组件（1-2天）

**优先级：P1**

1. **Legend 基础组件**
   - [ ] 创建 Legend.tsx
   - [ ] 实现 Legend.scss
   - [ ] 添加折叠/展开功能
   - [ ] 添加位置配置

2. **集成到应用**
   - [ ] 在 App.tsx 中添加 Legend
   - [ ] 实现动态数据更新
   - [ ] 添加配置界面（让用户自定义图例）

3. **思维导图专用 Legend**
   - [ ] 根据节点层级生成图例
   - [ ] 显示颜色含义
   - [ ] 显示节点统计信息

**依赖关系：**
- 可以和阶段 2、3 并行开发
- 思维导图 Legend 需要等阶段 2 完成

---

### 阶段 5：优化和完善（2-3天）

**优先级：P2**

1. **性能优化**
   - [ ] 优化大型思维导图渲染
   - [ ] 实现虚拟滚动
   - [ ] 添加懒加载
   - [ ] 优化动画性能

2. **用户体验优化**
   - [ ] 添加键盘快捷键
   - [ ] 添加撤销/重做支持
   - [ ] 添加拖拽调整节点位置
   - [ ] 添加节点编辑功能

3. **错误处理和边界情况**
   - [ ] 完善 API 错误处理
   - [ ] 添加网络超时处理
   - [ ] 处理无效响应
   - [ ] 添加用户友好的错误提示

4. **测试**
   - [ ] 单元测试
   - [ ] 集成测试
   - [ ] E2E 测试
   - [ ] 性能测试

**依赖关系：**
- 需要等前面所有阶段完成

---

## 四、技术风险和注意事项

### 4.1 技术难点

#### 1. OpenRouter API 集成风险
**风险描述：**
- API 限流和配额管理
- 网络请求失败处理
- 流式响应的稳定性

**解决方案：**
- 实现请求重试机制（指数退避）
- 添加请求队列管理
- 实现 API Key 轮换（支持多个 Key）
- 添加详细的错误日志

```typescript
// 示例：重试机制
async function fetchWithRetry(
  fn: () => Promise<Response>,
  maxRetries = 3,
  delay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
```

#### 2. 思维导图布局算法
**风险描述：**
- 复杂的树形结构可能导致节点重叠
- 大型思维导图性能问题
- 不同布局方向的实现复杂度

**解决方案：**
- 使用成熟的布局算法（Reingold-Tilford）
- 实现增量布局优化
- 添加布局参数配置（间距、方向等）
- 使用 Web Worker 处理大型计算

```typescript
// 示例：使用 Web Worker
// worker.ts
self.onmessage = (e) => {
  const { mindMap, config } = e.data;
  const positions = calculateNodePositions(mindMap, config);
  self.postMessage(positions);
};

// 主线程
const worker = new Worker('worker.ts');
worker.postMessage({ mindMap, config });
worker.onmessage = (e) => {
  setPositions(e.data);
};
```

#### 3. 性能问题
**风险描述：**
- 大量 DOM 元素导致渲染卡顿
- 复杂动画影响性能
- 内存泄漏风险

**解决方案：**
- 使用虚拟滚动（只渲染可见区域）
- 使用 CSS transform 而非 position
- 实现元素池（复用 DOM 元素）
- 添加性能监控

```typescript
// 示例：虚拟滚动
function VirtualScroll({ items, itemHeight, containerHeight }) {
  const [scrollTop, setScrollTop] = useState(0);
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return (
    <div onScroll={(e) => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: items.length * itemHeight }}>
        <div style={{ transform: `translateY(${visibleStart * itemHeight}px)` }}>
          {visibleItems.map(item => <Item key={item.id} {...item} />)}
        </div>
      </div>
    </div>
  );
}
```

### 4.2 兼容性问题

#### 1. 浏览器兼容性
**注意事项：**
- CSS Grid 和 Flexbox 兼容性
- CSS 变量支持
- Canvas API 支持
- Web Worker 支持

**解决方案：**
- 添加浏览器特性检测
- 提供 polyfill
- 设置最低浏览器版本要求

#### 2. 移动端适配
**注意事项：**
- 触摸事件处理
- 响应式布局
- 性能优化

**解决方案：**
- 使用响应式设计
- 添加触摸手势支持
- 优化移动端性能

### 4.3 安全性考虑

#### 1. API Key 管理
**风险：**
- API Key 泄露
- 未授权访问

**解决方案：**
- 使用环境变量存储 API Key
- 实现用户自己的 API Key 输入
- 不在代码中硬编码任何密钥
- 添加 API Key 验证

```typescript
// 示例：安全的 API Key 管理
const getApiKey = async (): Promise<string> => {
  // 1. 优先从用户配置获取
  const userKey = await getUserConfig("openrouter_api_key");
  if (userKey) return userKey;
  
  // 2. 从环境变量获取（仅开发环境）
  if (process.env.NODE_ENV === "development") {
    return process.env.OPENROUTER_API_KEY || "";
  }
  
  // 3. 提示用户输入
  throw new Error("Please configure your OpenRouter API Key");
};
```

#### 2. 内容安全
**风险：**
- XSS 攻击
- 注入攻击

**解决方案：**
- 对所有用户输入进行转义
- 使用 CSP（Content Security Policy）
- 验证 API 响应

```typescript
// 示例：输入验证
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
```

### 4.4 可维护性

#### 1. 代码组织
**原则：**
- 模块化设计
- 单一职责原则
- 清晰的命名规范

**实施：**
- 按功能模块组织代码
- 使用 TypeScript 类型系统
- 添加详细的注释

#### 2. 测试覆盖
**目标：**
- 单元测试覆盖率 > 80%
- 关键路径 E2E 测试
- 性能测试

**工具：**
- Jest（单元测试）
- Playwright（E2E 测试）
- Testing Library（React 组件测试）

---

## 五、关键实现文件清单

### 5.1 新增文件

#### 思维导图功能
```
packages/excalidraw/components/MindMapDialog/
├── MindMapDialog.tsx
├── MindMapGenerator.tsx
├── MindMapPreview.tsx
├── hooks/
│   ├── useMindMapGeneration.ts
│   └── useOpenRouter.ts
├── utils/
│   ├── OpenRouterStreamFetch.ts
│   ├── MindMapParser.ts
│   └── MindMapToExcalidraw.ts
├── types.ts
└── MindMapDialog.scss

packages/excalidraw/actions/
└── actionMindMap.ts
```

#### 赛博朋克主题
```
packages/excalidraw/css/
└── theme-cyberpunk.scss

packages/excalidraw/components/Legend/
├── Legend.tsx
├── LegendConfig.tsx
└── Legend.scss
```

### 5.2 修改文件

#### 核心文件
```
packages/excalidraw/context/tunnels.ts
packages/excalidraw/components/Actions.tsx
packages/excalidraw/components/App.tsx
packages/excalidraw/components/MobileToolBar.tsx
```

#### 样式文件
```
packages/excalidraw/components/Toolbar.scss
packages/excalidraw/components/Dialog.scss
packages/excalidraw/components/Button.scss
packages/excalidraw/components/Island.scss
packages/excalidraw/css/theme.scss
```

---

## 六、预期效果

### 6.1 功能演示流程

```
1. 用户点击工具栏的"思维导图"按钮
   ↓
2. 打开 MindMapDialog 对话框
   - 显示赛博朋克风格的界面
   - 霓虹边框和发光效果
   - 背景网格和扫描线
   ↓
3. 用户输入主题（例如："机器学习基础"）
   - 选择布局方式（水平/垂直/径向）
   - 选择生成深度（2-4层）
   ↓
4. 点击"Generate"按钮
   - 显示加载动画
   - 流式显示生成状态
   ↓
5. AI 生成思维导图
   - 解析 JSON 响应
   - 转换为 Excalidraw 元素
   - 在预览区显示
   ↓
6. 用户预览和调整
   - 可以重新生成
   - 可以调整布局
   - 可以编辑节点
   ↓
7. 点击"Insert to Canvas"
   - 将思维导图插入到画布
   - 显示图例（Legend）
   - 图例显示：
     * 节点层级颜色说明
     * 节点数量统计
     * 布局信息
```

### 6.2 UI 效果展示

#### 赛博朋克主题特点
- **主色调**：霓虹紫（#b026ff）、青色（#00ffff）、品红（#ff00ff）
- **背景**：深色网格背景 + 扫描线动画
- **发光效果**：所有交互元素都有霓虹发光
- **动画**：平滑的过渡和脉冲效果
- **字体**：等宽字体 + 科技感

#### Legend 显示效果
- 半透明玻璃态背景
- 霓虹边框和发光
- 可折叠/展开
- 可拖拽调整位置
- 显示节点层级颜色图例
- 显示统计信息

---

## 七、后续扩展方向

### 7.1 功能扩展
1. **导出功能**
   - 导出为图片
   - 导出为 Markdown
   - 导出为 JSON

2. **协作功能**
   - 多人实时编辑
   - 评论和批注
   - 版本历史

3. **模板系统**
   - 预设思维导图模板
   - 自定义模板保存
   - 模板分享

### 7.2 AI 增强
1. **智能建议**
   - 节点内容建议
   - 布局优化建议
   - 相关主题推荐

2. **多模态支持**
   - 图片转思维导图
   - 文档转思维导图
   - 语音输入

3. **个性化**
   - 学习用户偏好
   - 自定义样式
   - 智能布局

---

## 八、总结

本实现方案基于 Excalidraw 现有架构，充分利用了：
- **Action 系统**：注册新功能
- **Dialog 系统**：参考 TTD 实现
- **Tunnel 系统**：组件通信
- **主题系统**：CSS 变量实现主题切换
- **元素系统**：创建自定义元素

实现优先级清晰，依赖关系明确，技术风险可控。预计总开发时间：**10-14 天**。

### Critical Files for Implementation

- `packages/excalidraw/components/MindMapDialog/MindMapDialog.tsx`
- `packages/excalidraw/components/MindMapDialog/utils/MindMapToExcalidraw.ts`
- `packages/excalidraw/css/theme-cyberpunk.scss`
- `packages/excalidraw/components/Legend/Legend.tsx`
- `packages/excalidraw/actions/actionMindMap.ts`
