interface RateLimitInfo {
  count: number;
  firstRequestTime: number;
  blockedUntil: number | null;
}

export class RateLimiter {
  private rateLimitStore: Map<string, RateLimitInfo> = new Map();
  private readonly MAX_REQUESTS = 10;
  private readonly TIME_WINDOW = 1000 * 60; // 1 minute in milliseconds
  private readonly BLOCK_DURATION = 1000 * 60 * 2; // 2 minutes in milliseconds

  constructor() {}

  public isAllowed(identifier: string): boolean {
    const now = Date.now();
    let info = this.rateLimitStore.get(identifier);
    
    // If no entry exists, create a new one
    if (!info) {
      this.rateLimitStore.set(identifier, {
        count: 1,
        firstRequestTime: now,
        blockedUntil: null
      });
      return true;
    }
    
    // Check if currently blocked
    if (info.blockedUntil !== null) {
      if (now < info.blockedUntil) {
        return false;
      } else {
        // Reset if block period is over
        info = {
          count: 1,
          firstRequestTime: now,
          blockedUntil: null
        };
        this.rateLimitStore.set(identifier, info);
        return true;
      }
    }
    
    // Check if time window has passed
    if (now - info.firstRequestTime > this.TIME_WINDOW) {
      // Reset counter for new time window
      info = {
        count: 1,
        firstRequestTime: now,
        blockedUntil: null
      };
      this.rateLimitStore.set(identifier, info);
      return true;
    }
    
    // Increment counter and check if limit is exceeded
    info.count += 1;
    if (info.count > this.MAX_REQUESTS) {
      info.blockedUntil = now + this.BLOCK_DURATION;
      this.rateLimitStore.set(identifier, info);
      return false;
    }
    
    this.rateLimitStore.set(identifier, info);
    return true;
  }

  public getBlockedUntil(identifier: string): number | null {
    const info = this.rateLimitStore.get(identifier);
    return info?.blockedUntil || null;
  }

  public reset(identifier: string): void {
    this.rateLimitStore.delete(identifier);
  }

  public incrementAttempts(identifier: string): void {
    const now = Date.now();
    let info = this.rateLimitStore.get(identifier);
    
    // If no entry exists, create a new one
    if (!info) {
      this.rateLimitStore.set(identifier, {
        count: 1,
        firstRequestTime: now,
        blockedUntil: null
      });
      return;
    }
    
    // Don't increment if already blocked
    if (info.blockedUntil !== null && now < info.blockedUntil) {
      return;
    }
    
    // Check if time window has passed
    if (now - info.firstRequestTime > this.TIME_WINDOW) {
      // Reset counter for new time window
      info = {
        count: 1,
        firstRequestTime: now,
        blockedUntil: null
      };
    } else {
      // Increment counter and check if limit is exceeded
      info.count += 1;
      if (info.count > this.MAX_REQUESTS) {
        info.blockedUntil = now + this.BLOCK_DURATION;
      }
    }
    
    this.rateLimitStore.set(identifier, info);
  }
}
