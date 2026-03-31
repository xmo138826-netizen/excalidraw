# 功能集成指南

本文档说明如何在 `excalidraw-app/` 中集成新实现的功能。

## 📋 已实现的功能

### ✅ Phase 1: AI 生成思维导图
- **类型定义**: `packages/excalidraw/components/TTDDialog/types.ts`
- **API 客户端**: `packages/excalidraw/components/TTDDialog/utils/apiClient.ts`
- **流式调用**: `packages/excalidraw/components/TTDDialog/utils/MindMapStreamFetch.ts`
- **布局算法**: `packages/excalidraw/components/TTDDialog/utils/layoutAlgorithm.ts`
- **元素转换**: `packages/excalidraw/components/TTDDialog/utils/MindMapToExcalidraw.ts`
- **UI 组件**: `packages/excalidraw/components/TTDDialog/MindMapTab.tsx`
- **样式文件**: `packages/excalidraw/components/TTDDialog/MindMapTab.scss`

### ✅ Phase 2: 赛博科技风格 UI
- **主题定义**: `excalidraw-app/public/css/theme-cyberpunk.scss`
- **背景效果**: `excalidraw-app/public/css/cyber-backgrounds.scss`
- **组件样式**: `excalidraw-app/public/css/cyber-components.scss`
- **动画效果**: `excalidraw-app/public/css/cyber-animations.scss`

### ✅ Phase 3: Legend 组件
- **组件文件**: `excalidraw-app/src/components/Legend/`
- **类型定义**: `Legend.types.ts`
- **主组件**: `Legend.tsx`
- **样式文件**: `Legend.scss`

---

## 🔧 集成步骤

### 步骤 1: 导入 CSS 样式

在 `excalidraw-app/public/index.html` 中添加:

```html
<!-- 赛博朋克主题 -->
<link rel="stylesheet" href="/css/theme-cyberpunk.scss" />
<link rel="stylesheet" href="/css/cyber-backgrounds.scss" />
<link rel="stylesheet" href="/css/cyber-components.scss" />
<link rel="stylesheet" href="/css/cyber-animations.scss" />

<!-- Orbitron 字体 (可选,用于赛博朋克风格) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 步骤 2: 配置环境变量

在 `excalidraw-app/.env` 中添加:

```bash
# AI API 配置
REACT_APP_AI_API_PROVIDER=zhipu
REACT_APP_AI_API_KEY=your_api_key_here
REACT_APP_AI_API_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
REACT_APP_AI_MODEL=glm-4-flash

# 或使用 OpenRouter
# REACT_APP_AI_API_PROVIDER=openrouter
# REACT_APP_AI_API_KEY=your_openrouter_key
# REACT_APP_AI_API_BASE_URL=https://openrouter.ai/api/v1/chat/completions
# REACT_APP_AI_MODEL=anthropic/claude-3.5-sonnet
```

### 步骤 3: 修改 App.tsx 应用主题

```typescript
// excalidraw-app/App.tsx
import "./index.css";
// 导入赛博朋克主题 CSS
import "/css/theme-cyberpunk.scss";
import "/css/cyber-backgrounds.scss";
import "/css/cyber-components.scss";
import "/css/cyber-animations.scss";

import { Excalidraw } from "@excalidraw/excalidraw";
import { Legend, generateLegendItems, generateStats } from "./components/Legend";

function App() {
  // 主题状态
  const [theme, setTheme] = useState<"light" | "dark" | "cyberpunk">("cyberpunk");

  // 思维导图数据状态 (用于 Legend)
  const [legendData, setLegendData] = useState<{
    items: LegendItem[];
    stats: LegendStats;
  } | null>(null);

  return (
    <div className={`excalidraw theme--${theme}`}>
      {/* 可选: 添加背景效果容器 */}
      <div className="cyber-particles-container">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="cyber-glows-container">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
      </div>

      {/* Excalidraw 主组件 */}
      <Excalidraw
        theme={theme === "cyberpunk" ? "light" : theme} // Excalidraw 原生主题
        onChangeTheme={(newTheme) => {
          // 切换到赛博朋克主题
          if (newTheme === "light") {
            setTheme("cyberpunk");
          } else {
            setTheme(newTheme);
          }
        }}
      >
        {/* 思维导图功能已经集成到 TTDDialog 中,无需额外配置 */}
      </Excalidraw>

      {/* Legend 组件 */}
      {legendData && (
        <Legend
          items={legendData.items}
          stats={legendData.stats}
          position="bottom-right"
        />
      )}
    </div>
  );
}

export default App;
```

### 步骤 4: 添加主题切换器 (可选)

```typescript
// excalidraw-app/components/ThemeSwitcher.tsx
import React from "react";

interface ThemeSwitcherProps {
  theme: "light" | "dark" | "cyberpunk";
  onThemeChange: (theme: "light" | "dark" | "cyberpunk") => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onThemeChange }) => {
  return (
    <div className="theme-switcher">
      <button
        className={`theme-option ${theme === "light" ? "active" : ""}`}
        onClick={() => onThemeChange("light")}
      >
        ☀️ 亮色
      </button>
      <button
        className={`theme-option ${theme === "dark" ? "active" : ""}`}
        onClick={() => onThemeChange("dark")}
      >
        🌙 暗色
      </button>
      <button
        className={`theme-option ${theme === "cyberpunk" ? "active" : ""}`}
        onClick={() => onThemeChange("cyberpunk")}
      >
        ⚡ 赛博
      </button>
    </div>
  );
};
```

---

## 🎯 使用 AI 生成思维导图

### 1. 打开 TTD 对话框

在 Excalidraw 中:
1. 点击工具栏上的 "AI" 按钮
2. 或使用快捷键 `Ctrl/Cmd + Shift + M`

### 2. 切换到思维导图标签页

在 TTD 对话框中,点击 "思维导图" 标签。

### 3. 输入主题并生成

1. 在文本框中输入主题,例如:
   - "机器学习"
   - "Web 开发技术栈"
   - "人工智能应用"

2. 选择布局方式:
   - **水平布局**: 根节点在左侧,子节点向右展开
   - **垂直布局**: 根节点在顶部,子节点向下展开
   - **径向布局**: 根节点在中心,子节点呈放射状展开

3. 点击 "生成思维导图" 按钮

4. 等待 AI 生成,可以看到:
   - 实时进度显示
   - 流式响应内容
   - 生成完成的思维导图预览

5. 点击 "插入到画布" 将思维导图插入到 Excalidraw 画布

---

## 🎨 赛博朋克主题特性

### 视觉效果

1. **网格背景**
   - 40px × 40px 网格
   - 慢速滚动动画
   - 霓虹紫色彩

2. **扫描线效果**
   - 垂直扫描线
   - 8秒循环
   - 半透明效果

3. **霓虹发光**
   - 所有交互元素
   - 悬停时增强
   - 霓虹紫/青/粉色系

4. **玻璃态效果**
   - 所有面板和对话框
   - backdrop-filter: blur(20px)
   - 半透明背景

### 颜色方案

- **主色**: 霓虹紫 #b026ff
- **强调色**: 霓虹青 #00ffff
- **次要色**: 霓虹粉 #ff00ff
- **背景**: 深黑 #0a0a0f

### 动画效果

- 按钮光泽动画
- 工具栏悬停缩放
- 对话框渐入
- 滚动条发光

---

## 📊 Legend 组件使用

### 基础用法

```typescript
import { Legend } from "./components/Legend";

function App() {
  return (
    <Legend
      items={[
        { color: "#b026ff", label: "根节点", count: 1, glow: true },
        { color: "#00ffff", label: "一级节点", count: 3 },
        { color: "#ff00ff", label: "二级节点", count: 8 },
      ]}
      stats={{
        totalNodes: 12,
        maxDepth: 3,
        totalElements: 23,
      }}
      position="bottom-right"
      isCollapsible={true}
    />
  );
}
```

### 与思维导图集成

```typescript
import { Legend, generateLegendItems, generateStats } from "./components/Legend";
import { calculateMindMapStats } from "@excalidraw/excalidraw/components/TTDDialog/utils/MindMapStreamFetch";

function App() {
  const [legendData, setLegendData] = useState(null);

  // 在生成思维导图后更新 Legend
  const handleMindMapGenerated = (mindMapData) => {
    const stats = calculateMindMapStats(mindMapData.rootNode);
    const items = generateLegendItems(
      mindMapData.levelColors,
      stats.levelCounts
    );

    setLegendData({
      items,
      stats: generateStats(
        stats.totalNodes,
        stats.totalConnections,
        stats.maxDepth
      ),
    });
  };

  return (
    <>
      <Excalidraw onMindMapGenerated={handleMindMapGenerated} />
      {legendData && <Legend {...legendData} />}
    </>
  );
}
```

---

## 🐛 故障排除

### 问题 1: API 调用失败

**症状**: 点击生成按钮后显示错误

**解决方案**:
1. 检查 `.env` 文件中的 API Key 是否正确
2. 确认 API 服务是否可用
3. 检查网络连接

### 问题 2: 主题样式未生效

**症状**: 界面没有赛博朋克风格

**解决方案**:
1. 确认 CSS 文件已正确导入
2. 检查 `theme--cyberpunk` 类是否应用到根元素
3. 清除浏览器缓存

### 问题 3: Legend 不显示

**症状**: Legend 组件不显示

**解决方案**:
1. 确认 `legendData` 状态已正确设置
2. 检查 `items` 和 `stats` 数据格式
3. 查看 Console 是否有错误

---

## 📝 API 参考

### MindMapDialog.OnMindMapSubmitProps

```typescript
interface OnMindMapSubmitProps {
  prompt: string;
  onProgress?: (progress: GenerationProgress) => void;
  onChunk?: (chunk: string) => void;
  onStreamCreated?: () => void;
  signal?: AbortSignal;
}
```

### MindMapDialog.LayoutConfig

```typescript
interface LayoutConfig {
  type: "horizontal" | "vertical" | "radial";
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
}
```

### LegendProps

```typescript
interface LegendProps {
  items: LegendItem[];
  stats?: LegendStats;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}
```

---

## 🎓 最佳实践

### 1. API Key 管理

- **不要**将 API Key 硬编码在代码中
- **使用**环境变量
- **考虑**在生产环境使用后端代理

### 2. 性能优化

- 对于大型思维导图(50+ 节点),考虑使用 Web Worker
- 实现虚拟滚动优化 Legend 显示
- 对 API 调用进行防抖处理

### 3. 用户体验

- 提供清晰的错误提示
- 显示加载进度
- 支持取消操作
- 提供重试机制

---

## 🚀 未来改进

### 计划中的功能

1. **高级布局算法**
   - 力导向布局
   - 树状图布局
   - 自适应布局

2. **更多 AI 服务**
   - OpenAI GPT-4
   - Anthropic Claude
   - 其他 LLM 服务

3. **导出功能**
   - 导出为图片
   - 导出为 PDF
   - 导出为 JSON

4. **协作功能**
   - 实时协作编辑
   - 评论和批注
   - 版本历史

---

**文档版本**: 1.0.0
**最后更新**: 2025-04-01
**作者**: Claude Code
