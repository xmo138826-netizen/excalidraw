/**
 * MindMapTab 组件 - 简化版本
 *
 * 思维导图生成标签页，直接调用后端 API
 */

import React, { useState } from "react";
import { useUIAppState } from "../../context/ui-appState";
import { useApp } from "../App";
import { t } from "../../i18n";

import "./MindMapTab.scss";

console.log("[MindMapTab] Component loaded");

interface MindMapTabProps {
  onTextSubmit?: any;
}

interface GenerationProgress {
  stage: "idle" | "connecting" | "generating" | "done" | "error";
  message: string;
  percent: number;
}

export const MindMapTab = (props: MindMapTabProps) => {
  console.log("[MindMapTab] Render called", props);

  const appState = useUIAppState();
  const app = useApp();

  // 输入状态
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: "idle",
    message: "",
    percent: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  /**
   * 调用后端 API 生成思维导图
   */
  const handleGenerate = async () => {
    console.log("[MindMapTab] Generate button clicked, prompt:", prompt);

    if (!prompt.trim()) {
      setError("请输入思维导图主题");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      setProgress({ stage: "connecting", message: "正在连接 AI 服务...", percent: 10 });

      console.log("[MindMapTab] Calling API at http://localhost:3016/v1/ai/text-to-diagram/chat-streaming");

      const response = await fetch("http://localhost:3016/v1/ai/text-to-diagram/chat-streaming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      console.log("[MindMapTab] API response status:", response.status);

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      setProgress({ stage: "generating", message: "AI 正在生成思维导图...", percent: 20 });

      // 读取流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content" && parsed.delta) {
                  fullContent += parsed.delta;
                  setProgress({
                    stage: "generating",
                    message: "正在接收数据...",
                    percent: 50,
                  });
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      console.log("[MindMapTab] Generated content length:", fullContent.length);

      setResult(fullContent);
      setProgress({ stage: "done", message: "思维导图生成完成！", percent: 100 });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      console.error("[MindMapTab] Error:", errorMessage);
      setError(errorMessage);
      setProgress({ stage: "error", message: `生成失败: ${errorMessage}`, percent: 0 });
    } finally {
      setIsGenerating(false);
    }
  };

  console.log("[MindMapTab] Rendering UI");

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "24px", fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
          AI 思维导图生成
        </h3>
        <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "20px" }}>
          输入主题，AI 将自动生成思维导图的 Mermaid 代码
        </p>

        <textarea
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "16px",
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: "100px",
            boxSizing: "border-box"
          }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：机器学习核心概念、React 生态系统、Python 数据科学栈..."
          disabled={isGenerating}
        />

        <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          <button
            style={{
              flex: 1,
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              background: isGenerating || !prompt.trim() ? "#ccc" : "linear-gradient(135deg, #b026ff, #00d4ff)",
              color: "#fff",
              cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer",
              opacity: isGenerating || !prompt.trim() ? 0.6 : 1
            }}
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? "生成中..." : "生成思维导图"}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "rgba(255, 0, 85, 0.1)",
            border: "2px solid #ff0055",
            borderRadius: "8px",
            color: "#ff0055"
          }}>
            <strong>错误：</strong>
            {error}
          </div>
        )}

        {progress.stage !== "idle" && (
          <div style={{
            marginTop: "16px",
            padding: "16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px"
          }}>
            <div style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "8px"
            }}>
              <div
                style={{
                  width: `${progress.percent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #b026ff, #00d4ff)",
                  transition: "width 0.3s ease"
                }}
              />
            </div>
            <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
              {progress.message}
            </div>
          </div>
        )}
      </div>

      {result && (
        <div style={{
          padding: "20px",
          backgroundColor: "#f5f5f5",
          border: "2px solid #ddd",
          borderRadius: "8px"
        }}>
          <h4 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
            生成的 Mermaid 代码：
          </h4>
          <pre style={{
            backgroundColor: "#fff",
            padding: "16px",
            borderRadius: "8px",
            overflowX: "auto",
            fontSize: "14px",
            lineHeight: "1.5",
            margin: 0
          }}>
            {result}
          </pre>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "12px", marginBottom: 0 }}>
            💡 提示：复制上述代码，在 Excalidraw 中使用 Mermaid 插件即可渲染
          </p>
        </div>
      )}
    </div>
  );
};
