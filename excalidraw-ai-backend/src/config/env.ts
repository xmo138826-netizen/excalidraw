import dotenv from "dotenv";
import type { EnvConfig } from "../types";

// Load environment variables from .env file
dotenv.config();

export const config: EnvConfig = {
  port: parseInt(process.env.PORT || "3016", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  zhipuAIApiKey: process.env.ZHIPUAI_API_KEY || "",
  zhipuAIModel: process.env.ZHIPUAI_MODEL || "glm-4-flash",
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || "100", 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "86400000", 10),
  logLevel: process.env.LOG_LEVEL || "info",
};

// Validate required environment variables
if (!config.zhipuAIApiKey) {
  throw new Error("ZHIPUAI_API_KEY is required. Please set it in your .env file or environment variables.");
}

if (config.nodeEnv === "production" && config.zhipuAIApiKey.includes("your-key")) {
  throw new Error("Invalid ZHIPUAI_API_KEY in production. Please set a valid API key.");
}

// Log configuration in development
if (config.nodeEnv === "development") {
  console.log("🔧 Configuration loaded:", {
    port: config.port,
    nodeEnv: config.nodeEnv,
    model: config.zhipuAIModel,
    rateLimit: config.rateLimitLimit,
  });
}
