import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

/**
 * Global error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("❌ Error:", err);

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  const statusCode = (err as any).statusCode || 500;

  // Format error response
  const errorResponse = {
    type: "error",
    error: {
      message:
        config.nodeEnv === "production"
          ? "Internal server error"
          : err.message,
      status: statusCode,
    },
  };

  res.status(statusCode).json(errorResponse);
}
