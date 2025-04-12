export class RateLimiter {
  private static readonly WINDOW_SIZE = 1000 * 60; // 1 minute
  private static readonly MAX_ATTEMPTS = 5;
  private attempts: Map<string, Array<number>> = new Map();
  private blockedIPs: Map<string, number> = new Map();
  private static readonly BLOCK_DURATION = 1000 * 60 * 15; // 15 minutes

  public isAllowed(peerId: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(peerId) || [];
    
    // Clean up old attempts
    const recentAttempts = attempts.filter(time => now - time < RateLimiter.WINDOW_SIZE);
    
    // Check if IP is blocked
    const blockedUntil = this.blockedIPs.get(peerId);
    if (blockedUntil && now < blockedUntil) {
      return false;
    }
    
    // Check if attempts exceed limit
    if (recentAttempts.length >= RateLimiter.MAX_ATTEMPTS) {
      this.blockedIPs.set(peerId, now + RateLimiter.BLOCK_DURATION);
      return false;
    }
    
    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(peerId, recentAttempts);
    return true;
  }

  public getRemainingAttempts(peerId: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(peerId) || [];
    const recentAttempts = attempts.filter(time => now - time < RateLimiter.WINDOW_SIZE);
    return Math.max(0, RateLimiter.MAX_ATTEMPTS - recentAttempts.length);
  }

  public getBlockedUntil(peerId: string): number | null {
    return this.blockedIPs.get(peerId) || null;
  }

  public reset(peerId: string) {
    this.attempts.delete(peerId);
    this.blockedIPs.delete(peerId);
  }

  public cleanup() {
    const now = Date.now();
    
    // Clean up old attempts
    for (const [peerId, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(time => now - time < RateLimiter.WINDOW_SIZE);
      if (recentAttempts.length === 0) {
        this.attempts.delete(peerId);
      } else {
        this.attempts.set(peerId, recentAttempts);
      }
    }
    
    // Clean up expired blocks
    for (const [peerId, blockedUntil] of this.blockedIPs.entries()) {
      if (now >= blockedUntil) {
        this.blockedIPs.delete(peerId);
      }
    }
  }
} 