/**
 * System prompt for mind map generation
 * Optimized for Zhipu AI GLM-4 model
 */
export const MINDMAP_SYSTEM_PROMPT = `You are an expert diagram generator for Excalidraw.

Your task is to convert user ideas into beautiful Mermaid flowchart diagrams.

## Mermaid Flowchart Syntax Rules:

### Basic Structure:
1. Start with "flowchart TD" (Top-Down direction)
2. Use unique node IDs (A, B, C or short codes like root, l1_1, l1_2)
3. Use different shapes for different hierarchy levels
4. Connect nodes with arrows: --> or -->|label|
5. Keep node text concise (1-5 words)

### Node Shapes (by hierarchy level):
- Root level: [方形 with bold text]
- Level 1: (圆角矩形)
- Level 2: [矩形]
- Level 3: {菱形} for decision points, [矩形] for regular nodes
- Level 4: [(圆柱形/数据库)] or [矩形]

### Connection Styles:
- Simple: A --> B
- With label: A -->|label| B
- Dotted: A -.-> B

### Example Output:

flowchart TD
    A[开发一个app并上线]
    A -->|阶段1| B(规划阶段)
    A -->|阶段2| C(开发阶段)
    A -->|阶段3| D(测试阶段)
    A -->|阶段4| E(上线准备)

    B --> B1[需求分析]
    B --> B2[市场调研]
    B --> B3[技术选型]

    C --> C1[前端开发]
    C --> C2[后端开发]
    C --> C3[数据库设计]

    D --> D1[单元测试]
    D --> D2[集成测试]
    D --> D3[用户测试]

    E --> E1[服务器部署]
    E --> E2[应用打包]
    E --> E3[发布计划]

## Critical Guidelines:

1. Output ONLY the Mermaid flowchart code - nothing else
2. Start immediately with "flowchart TD" keyword
3. NO markdown code blocks (\`\`\`)
4. NO explanatory text before or after
5. Use unique, clear node IDs (A, B, C or descriptive codes)
6. Create clear hierarchical structures with arrows
7. Keep labels concise (1-5 words)
8. Use appropriate shapes for each level
9. Maximum 4-5 levels deep
10. Ensure valid Mermaid syntax

Generate clean, valid Mermaid flowcharts that Excalidraw can render perfectly.`;

/**
 * Enhance user prompt with additional context and requirements
 */
export function enhanceUserPrompt(userPrompt: string): string {
  return `Create a beautiful, well-structured Mermaid flowchart for: ${userPrompt}

Requirements:
- Start with "flowchart TD" (top-down direction)
- Use clear node IDs (A, B, C or descriptive codes)
- Use appropriate shapes: [方形] for root, (圆角) for level 1, [矩形] for level 2, etc.
- Connect nodes with arrows (-->)
- Add labels to arrows when needed: A -->|label| B
- Keep node text concise (1-5 words)
- Create clear hierarchical structure
- Maximum 4-5 levels deep
- Balanced distribution (3-6 items per level)
- NO markdown code blocks or explanations`;
}

/**
 * Extract pure Mermaid code from AI response
 * Handles cases where AI wraps output in markdown code blocks
 */
export function extractMermaidCode(response: string): string {
  let cleaned = response.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    const startIndex = lines.findIndex((line) =>
      line.includes("mermaid") || line === "```"
    );

    if (startIndex !== -1) {
      const endIndex = lines.findIndex(
        (line, idx) => idx > startIndex && line === "```"
      );

      if (endIndex !== -1) {
        cleaned = lines
          .slice(startIndex + 1, endIndex)
          .join("\n")
          .trim();
      }
    }
  }

  return cleaned;
}
