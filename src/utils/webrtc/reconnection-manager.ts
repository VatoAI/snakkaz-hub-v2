
import { ConnectionManager } from './connection-manager';

export class ReconnectionManager {
  private reconnectAttempts: Map<string, number> = new Map();
  
  constructor(
    private connectionManager: ConnectionManager,
    private maxReconnectAttempts: number = 3
  ) {}

  public async attemptReconnect(peerId: string, publicKey: JsonWebKey): Promise<any> {
    const attempts = this.reconnectAttempts.get(peerId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnection attempts (${this.maxReconnectAttempts}) reached for peer ${peerId}`);
      // Reset for future attempts
      this.reconnectAttempts.set(peerId, 0);
      throw new Error(`Max reconnection attempts reached for peer ${peerId}`);
    }
    
    try {
      console.log(`Attempting to reconnect with peer ${peerId} (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      const result = await this.connectionManager.attemptReconnect(peerId, publicKey);
      
      // Reset reconnect attempts on success
      this.reconnectAttempts.delete(peerId);
      
      return result;
    } catch (error) {
      // Increment reconnect attempts
      this.reconnectAttempts.set(peerId, attempts + 1);
      console.error(`Reconnection attempt ${attempts + 1} to peer ${peerId} failed:`, error);
      throw error;
    }
  }
  
  public resetAttempts(peerId: string): void {
    this.reconnectAttempts.delete(peerId);
  }
  
  public getAttempts(peerId: string): number {
    return this.reconnectAttempts.get(peerId) || 0;
  }
}
