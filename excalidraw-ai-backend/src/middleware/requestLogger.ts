import { Request, Response, NextFunction } from "express";

/**
 * Request logger middleware
 * Logs basic information about each request
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log request
  console.log(`📥 ${req.method} ${req.path}`);

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode < 400 ? "✅" : "⚠️";
    console.log(
      `${statusEmoji} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}
