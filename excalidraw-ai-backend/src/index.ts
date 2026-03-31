import express from "express";
import cors from "cors";
import compression from "compression";
import { config } from "./config/env";
import chatRoutes from "./routes/chatStreaming";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

const app = express();

// Middleware
app.use(
  cors({
    origin:
      config.nodeEnv === "production"
        ? ["https://excalidraw.com", "https://plus.excalidraw.com"]
        : "*",
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "excalidraw-ai-backend",
    version: "1.0.0",
  });
});

// API routes
app.use("/v1/ai/text-to-diagram", chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    type: "error",
    error: {
      message: "Not found",
      status: 404,
    },
  });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log("");
  console.log("🚀 Excalidraw AI Backend");
  console.log("================================");
  console.log(`✅ Server running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🧠 Model: ${config.zhipuAIModel}`);
  console.log(`⏱️  Rate limit: ${config.rateLimitLimit} per ${config.rateLimitWindowMs}ms`);
  console.log("================================");
  console.log("");
  console.log("📡 API Endpoints:");
  console.log(`   POST http://localhost:${config.port}/v1/ai/text-to-diagram/chat-streaming`);
  console.log(`   GET  http://localhost:${config.port}/health`);
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT received, shutting down...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
