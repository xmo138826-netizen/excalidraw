import fetch from "node-fetch";
import type { ZhipuAIRequest, ZhipuAIStreamChunk, ZhipuAIMessage } from "../types";
import { config } from "../config/env";
import { MINDMAP_SYSTEM_PROMPT, enhanceUserPrompt } from "../prompts/mindmapPrompts";

/**
 * Zhipu AI Service
 * Handles API calls to Zhipu AI GLM-4 model
 */
export class ZhipuAIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.zhipuAIApiKey;
    this.model = config.zhipuAIModel;
    this.baseUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  }

  /**
   * Stream chat completion from Zhipu AI
   * @param userMessages - Array of user messages
   * @returns AsyncGenerator yielding content chunks
   */
  async *streamChat(
    userMessages: Array<{ role: string; content: string }>
  ): AsyncGenerator<string, void, unknown> {
    // Prepare messages for Zhipu AI
    const messages: ZhipuAIMessage[] = [
      { role: "system", content: MINDMAP_SYSTEM_PROMPT },
      ...userMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.role === "user" ? enhanceUserPrompt(msg.content) : msg.content,
      })),
    ];

    const requestBody: ZhipuAIRequest = {
      model: this.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 0.9,
    };

    console.log(`🤖 Calling Zhipu AI with model: ${this.model}`);

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Zhipu AI API error: ${response.status} - ${errorText}`);
        throw new Error(`Zhipu AI API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No response body from Zhipu AI");
      }

      // Parse SSE stream (Node.js 18+ Web Streams API)
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        for await (const chunk of response.body as any) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              console.log("✅ Zhipu AI stream completed");
              break;
            }

            try {
              const parsedChunk: ZhipuAIStreamChunk = JSON.parse(data);
              const content = parsedChunk.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }

              const finishReason = parsedChunk.choices[0]?.finish_reason;
              if (finishReason) {
                console.log(`✅ Generation finished: ${finishReason}`);
                break;
              }
            } catch (parseError) {
              console.warn("Failed to parse Zhipu AI chunk:", data, parseError);
            }
          }
        }
      } finally {
        // Ensure the stream is properly closed
        if (response.body && typeof (response.body as any).cancel === 'function') {
          await (response.body as any).cancel();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Zhipu AI streaming failed:", error.message);
        throw new Error(`Zhipu AI streaming failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Non-streaming chat completion (for fallback)
   * @param userMessages - Array of user messages
   * @returns Complete response text
   */
  async chatCompletion(
    userMessages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const messages: ZhipuAIMessage[] = [
      { role: "system", content: MINDMAP_SYSTEM_PROMPT },
      ...userMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.role === "user" ? enhanceUserPrompt(msg.content) : msg.content,
      })),
    ];

    const requestBody = {
      model: this.model,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 4000,
    };

    console.log(`🤖 Calling Zhipu AI (non-streaming) with model: ${this.model}`);

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zhipu AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";

      console.log("✅ Zhipu AI response received");
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Zhipu AI request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
