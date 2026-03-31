import { Router, Request, Response } from "express";
import { ZhipuAIService } from "../services/zhipuAI";
import { transformToExcalidrawStream, formatSSE, formatSSEDone } from "../services/streamTransformer";
import { rateLimiter } from "../services/rateLimiter";
import type { ChatRequest, StreamChunk } from "../types";

const router = Router();
const zhipuAIService = new ZhipuAIService();

/**
 * POST /v1/ai/text-to-diagram/chat-streaming
 * Main endpoint for streaming AI responses
 * Compatible with Excalidraw's TTDStreamFetch format
 */
router.post("/chat-streaming", async (req: Request, res: Response): Promise<void> => {
  const clientIP = (req.ip || req.socket.remoteAddress || "unknown").split(":")[0];

  try {
    // Parse request body
    const body: ChatRequest = req.body;

    if (!body.messages || !Array.isArray(body.messages)) {
      res.status(400).json({
        type: "error",
        error: { message: "Invalid request: messages array required", status: 400 },
      });
      return;
    }

    console.log(`🎯 New request from ${clientIP}`);
    console.log(`📝 Messages: ${body.messages.length}`);

    // Rate limiting
    const rateLimitInfo = rateLimiter.check(clientIP);

    // Set rate limit headers
    res.setHeader("X-Ratelimit-Limit", rateLimitInfo.limit.toString());
    res.setHeader("X-Ratelimit-Remaining", rateLimitInfo.remaining.toString());
    res.setHeader("X-Ratelimit-Reset", rateLimitInfo.reset.toISOString());

    if (rateLimitInfo.remaining === 0 && rateLimitInfo.limit !== rateLimitInfo.remaining + 1) {
      // Rate limit exceeded
      console.warn(`🚫 Rate limit exceeded for ${clientIP}`);
      res.status(429);
      const errorChunk: StreamChunk = {
        type: "error",
        error: {
          message: "Rate limit exceeded. Please try again later.",
          status: 429,
        },
      };
      res.write(formatSSE(errorChunk));
      res.write(formatSSEDone());
      res.end();
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering

    // Send last 3 messages (context window optimization)
    const recentMessages = body.messages.slice(-3);
    console.log(`💬 Processing ${recentMessages.length} recent messages`);

    // Stream response
    const contentGenerator = zhipuAIService.streamChat(recentMessages);
    const streamGenerator = transformToExcalidrawStream(contentGenerator);

    try {
      for await (const chunk of streamGenerator) {
        res.write(formatSSE(chunk));

        // End stream on error or done
        if (chunk.type === "error" || chunk.type === "done") {
          res.write(formatSSEDone());
          break;
        }
      }
    } catch (streamError) {
      console.error("Stream error:", streamError);
      const errorChunk: StreamChunk = {
        type: "error",
        error: {
          message: streamError instanceof Error ? streamError.message : "Streaming error",
          status: 500,
        },
      };
      res.write(formatSSE(errorChunk));
      res.write(formatSSEDone());
    } finally {
      res.end();
      console.log(`✅ Request completed for ${clientIP}`);
    }
  } catch (error) {
    console.error("Chat streaming error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        type: "error",
        error: {
          message: "Internal server error",
          status: 500,
        },
      });
    } else {
      const errorChunk: StreamChunk = {
        type: "error",
        error: {
          message: error instanceof Error ? error.message : "Unknown error",
          status: 500,
        },
      };
      res.write(formatSSE(errorChunk));
      res.write(formatSSEDone());
      res.end();
    }
  }
});

export default router;
