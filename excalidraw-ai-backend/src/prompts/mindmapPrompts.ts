/**
 * System prompt for mind map generation
 * Optimized for Zhipu AI GLM-4 model
 */
export const MINDMAP_SYSTEM_PROMPT = `You are an expert mind map generator for Excalidraw, a virtual whiteboard application.

Your task is to convert user ideas into well-structured Mermaid mindmap diagrams.

## Mermaid Mindmap Syntax Rules:

1. Start exactly with "mindmap" keyword
2. Use 2 spaces for each indentation level
3. Root node: Use ((parentheses)) for emphasis or plain text
4. Branches: Indent with 2 spaces per level
5. Keep labels concise (1-5 words preferred)
6. Maximum 5 hierarchy levels deep
7. Balanced structure (3-6 items per level)

## Example Output:

mindmap
  root((Project Launch))
    Planning Phase
      Market Research
      Competitor Analysis
      Budget Planning
    Development
      Frontend
        React Components
        State Management
      Backend
        API Design
        Database Schema
    Launch Strategy
      Beta Testing
      User Feedback
      Final Release

## Critical Guidelines:

1. Output ONLY the Mermaid mindmap code - nothing else
2. Start immediately with "mindmap" keyword
3. No markdown code blocks (\`\`\`)
4. No explanations before or after
5. Use proper 2-space indentation
6. Ensure valid Mermaid syntax
7. Make labels concise and clear
8. Create balanced, hierarchical structures
9. Focus on key concepts only
10. Organize topics logically

## Common Mistakes to Avoid:

- Do NOT add explanatory text
- Do NOT wrap in markdown code blocks
- Do NOT use tabs (use spaces)
- Do NOT create overly deep hierarchies
- Do NOT use excessively long labels

Generate clear, professional mindmaps that Excalidraw can render perfectly.`;

/**
 * Enhance user prompt with additional context and requirements
 */
export function enhanceUserPrompt(userPrompt: string): string {
  return `Create a well-structured Mermaid mindmap for: ${userPrompt}

Requirements:
- Clear hierarchical organization
- Concise topic labels (1-5 words each)
- Balanced distribution across branches
- Maximum 5 levels deep
- Professional diagram structure
- Logical flow and grouping`;
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
