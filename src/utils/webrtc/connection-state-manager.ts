import { ConnectionManager } from './connection-manager';

export class ConnectionStateManager {
  private connectionStates: Map<string, RTCPeerConnectionState>;
  private dataChannelStates: Map<string, RTCDataChannelState>;

  constructor(private connectionManager: ConnectionManager) {
    this.connectionStates = new Map();
    this.dataChannelStates = new Map();
  }
  
  public updateConnectionState(peerId: string, state: RTCPeerConnectionState) {
    this.connectionStates.set(peerId, state);
  }

  public updateDataChannelState(peerId: string, state: RTCDataChannelState) {
    this.dataChannelStates.set(peerId, state);
  }

  public isPeerReady(peerId: string): boolean {
    const connectionState = this.getConnectionState(peerId);
    const dataChannelState = this.getDataChannelState(peerId);
    
    return connectionState === 'connected' && dataChannelState === 'open';
  }
  
  public async ensurePeerReady(peerId: string, 
                               attemptReconnect: (peerId: string) => Promise<any>): Promise<boolean> {
    if (this.isPeerReady(peerId)) {
      return true;
    }
    
    try {
      await attemptReconnect(peerId);
      return this.isPeerReady(peerId);
    } catch (error) {
      console.error(`Failed to ensure peer ${peerId} is ready:`, error);
      return false;
    }
  }

  public getConnectionState(peerId: string): RTCPeerConnectionState {
    return this.connectionStates.get(peerId) || 'disconnected';
  }

  public getDataChannelState(peerId: string): RTCDataChannelState {
    return this.dataChannelStates.get(peerId) || 'closed';
  }
}
