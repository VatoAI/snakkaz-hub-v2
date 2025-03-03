
export class ConnectionRetryManager {
  private connectionAttempts: Map<string, number> = new Map();
  
  constructor(private maxConnectionAttempts: number = 5, 
              private retryTimeout: number = 10000) {}
  
  public incrementAttempts(peerId: string): number {
    const attempts = this.getAttempts(peerId);
    this.connectionAttempts.set(peerId, attempts + 1);
    return attempts + 1;
  }
  
  public getAttempts(peerId: string): number {
    return this.connectionAttempts.get(peerId) || 0;
  }
  
  public resetAttempts(peerId: string): void {
    this.connectionAttempts.delete(peerId);
  }
  
  public resetAllAttempts(): void {
    this.connectionAttempts.clear();
  }
  
  public hasReachedMaxAttempts(peerId: string): boolean {
    return this.getAttempts(peerId) >= this.maxConnectionAttempts;
  }
  
  public scheduleRetryReset(peerId: string): void {
    const attempts = this.getAttempts(peerId);
    setTimeout(() => {
      const currentAttempts = this.getAttempts(peerId);
      if (currentAttempts === attempts) {
        this.connectionAttempts.set(peerId, currentAttempts - 1);
      }
    }, this.retryTimeout);
  }
}
