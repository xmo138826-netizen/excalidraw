import type { RateLimitConfig, RateLimitInfo } from "../types";
import { config } from "../config/env";

interface RateLimitStore {
  count: number;
  reset: number;
}

/**
 * In-memory rate limiter
 * For production, consider using Redis for distributed rate limiting
 */
export class RateLimiter {
  private store: Map<string, RateLimitStore>;
  private config: RateLimitConfig;

  constructor() {
    this.store = new Map();
    this.config = {
      limit: config.rateLimitLimit,
      windowMs: config.rateLimitWindowMs,
    };
  }

  /**
   * Check rate limit for a given identifier
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns RateLimitInfo with current status
   */
  check(identifier: string): RateLimitInfo {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now > record.reset) {
      // Create new time window
      const newRecord: RateLimitStore = {
        count: 1,
        reset: now + this.config.windowMs,
      };
      this.store.set(identifier, newRecord);

      console.log(`📊 Rate limit [${identifier}]: 1/${this.config.limit} (new window)`);

      return {
        limit: this.config.limit,
        remaining: this.config.limit - 1,
        reset: new Date(newRecord.reset),
      };
    }

    // Check if limit exceeded
    if (record.count >= this.config.limit) {
      console.warn(`⚠️  Rate limit exceeded [${identifier}]: ${record.count}/${this.config.limit}`);

      return {
        limit: this.config.limit,
        remaining: 0,
        reset: new Date(record.reset),
      };
    }

    // Increment counter
    record.count++;
    this.store.set(identifier, record);

    const remaining = this.config.limit - record.count;
    console.log(`📊 Rate limit [${identifier}]: ${record.count}/${this.config.limit} (${remaining} remaining)`);

    return {
      limit: this.config.limit,
      remaining,
      reset: new Date(record.reset),
    };
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier
   * @returns true if allowed, false if rate limited
   */
  isAllowed(identifier: string): boolean {
    const info = this.check(identifier);
    return info.remaining > 0 || info.remaining === this.config.limit - 1;
  }

  /**
   * Get current count for identifier
   * @param identifier - Unique identifier
   * @returns Current request count or null if not found
   */
  getCount(identifier: string): number | null {
    const record = this.store.get(identifier);
    return record ? record.count : null;
  }

  /**
   * Reset rate limit for identifier
   * @param identifier - Unique identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
    console.log(`🔄 Rate limit reset [${identifier}]`);
  }

  /**
   * Cleanup expired entries
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.store.entries()) {
      if (now > record.reset) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Get store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup old entries every hour
setInterval(() => {
  rateLimiter.cleanup();
}, 3600000);

// Log store size every 5 minutes (development only)
if (config.nodeEnv === "development") {
  setInterval(() => {
    console.log(`📈 Rate limiter store size: ${rateLimiter.getStoreSize()}`);
  }, 300000);
}
