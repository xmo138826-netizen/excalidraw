/**
 * API 客户端配置
 *
 * 支持多种 AI 服务提供商:
 * - 智谱AI (zhipu)
 * - OpenRouter (openrouter)
 * - OpenAI (openai)
 */

export type AIProvider = "zhipu" | "openrouter" | "openai";

export interface MindMapAPIConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIGS: Record<AIProvider, Partial<MindMapAPIConfig>> = {
  zhipu: {
    baseURL: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    model: "glm-4-flash",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1/chat/completions",
    model: "anthropic/claude-3.5-sonnet",
  },
  openai: {
    baseURL: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
  },
};

/**
 * 从环境变量加载配置
 */
export const loadConfigFromEnv = (): MindMapAPIConfig => {
  // Vite 环境变量必须以 VITE_ 开头
  const provider = (import.meta.env.VITE_APP_AI_API_PROVIDER as AIProvider) || "zhipu";
  const apiKey = import.meta.env.VITE_APP_AI_API_KEY || "";
  const baseURL = import.meta.env.VITE_APP_AI_API_BASE_URL || DEFAULT_CONFIGS[provider].baseURL || "";
  const model = import.meta.env.VITE_APP_AI_MODEL || DEFAULT_CONFIGS[provider].model || "";

  return {
    provider,
    apiKey,
    baseURL,
    model,
  };
};

/**
 * 创建思维导图 API 客户端
 */
export const createMindMapAPIClient = (config: MindMapAPIConfig) => {
  /**
   * 验证配置
   */
  if (!config.apiKey) {
    throw new Error("AI API Key is not configured. Please set REACT_APP_AI_API_KEY environment variable.");
  }

  /**
   * 生成思维导图的系统提示词
   */
  const generateSystemPrompt = () => {
    return `你是一个专业的思维导图生成助手。你的任务是根据用户输入的主题,生成一个结构化的思维导图 JSON。

要求:
1. 返回纯 JSON 格式,不要有任何额外的文字说明
2. 思维导图应该有 3-5 个层级
3. 每个节点应该有简洁明了的文本
4. 根节点是用户输入的主题
5. 子节点应该逻辑清晰,层次分明

JSON 格式:
{
  "id": "root",
  "text": "主题名称",
  "level": 0,
  "children": [
    {
      "id": "child1",
      "text": "子主题1",
      "level": 1,
      "children": [...]
    },
    ...
  ]
}

请根据以下主题生成思维导图:`;
  };

  /**
   * 生成思维导图
   */
  const generateMindMap = async (
    prompt: string,
    options?: {
      signal?: AbortSignal;
      onChunk?: (chunk: string) => void;
    }
  ) => {
    const { signal, onChunk } = options || {};

    // 构建请求体
    const requestBody = {
      model: config.model,
      messages: [
        {
          role: "system",
          content: generateSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: !!onChunk, // 如果提供了 onChunk 回调,则启用流式响应
      temperature: 0.7,
    };

    // 发送请求
    const response = await fetch(config.baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        // OpenRouter 需要的额外头
        ...(config.provider === "openrouter" && {
          "HTTP-Referer": window.location.href,
          "X-Title": "Excalidraw Mind Map",
        }),
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    // 处理流式响应
    if (onChunk) {
      return handleStreamResponse(response, onChunk);
    }

    // 处理非流式响应
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return {
      content,
      usage: data.usage,
      model: data.model,
      headers: response.headers,
    };
  };

  /**
   * 处理流式响应
   */
  const handleStreamResponse = async (
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<{ content: string; headers: Headers }> => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            // 跳过 [DONE] 标记
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // 忽略解析错误
              console.warn("Failed to parse SSE chunk:", e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { content: fullContent, headers: response.headers };
  };

  return {
    generateMindMap,
    config,
  };
};

/**
 * 默认 API 客户端实例 (懒加载)
 */
let defaultClient: ReturnType<typeof createMindMapAPIClient> | null = null;

export const getMindMapAPIClient = () => {
  if (!defaultClient) {
    const config = loadConfigFromEnv();
    defaultClient = createMindMapAPIClient(config);
  }
  return defaultClient;
};
