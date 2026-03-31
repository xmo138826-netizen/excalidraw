// Request/Response types matching Excalidraw frontend
export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: readonly LLMMessage[];
}

export interface StreamChunk {
  type: "content" | "done" | "error";
  delta?: string;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
  error?: {
    message: string;
    status?: number;
  };
}

// Zhipu AI API types
export interface ZhipuAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ZhipuAIRequest {
  model: string;
  messages: ZhipuAIMessage[];
  stream: true;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface ZhipuAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

// Rate limiting
export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

// Environment
export interface EnvConfig {
  port: number;
  nodeEnv: string;
  zhipuAIApiKey: string;
  zhipuAIModel: string;
  rateLimitLimit: number;
  rateLimitWindowMs: number;
  logLevel: string;
}
