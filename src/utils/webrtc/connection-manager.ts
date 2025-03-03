
import { PeerManager } from './peer-manager';
import { ConnectionRetryManager } from './connection-retry-manager';
import { ConnectionTimeoutManager } from './connection-timeout-manager';
import { SecureConnectionManager } from './secure-connection-manager';

export class ConnectionManager {
  private retryManager: ConnectionRetryManager;
  private timeoutManager: ConnectionTimeoutManager;
  private secureConnectionManager: SecureConnectionManager;

  constructor(
    private peerManager: PeerManager,
    private secureConnections: Map<string, CryptoKey>,
    private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null
  ) {
    this.retryManager = new ConnectionRetryManager();
    this.timeoutManager = new ConnectionTimeoutManager();
    this.secureConnectionManager = new SecureConnectionManager(secureConnections);
  }

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey) {
    if (!this.localKeyPair) {
      throw new Error('Local key pair not initialized');
    }

    try {
      // Check if we've exceeded max connection attempts
      if (this.retryManager.hasReachedMaxAttempts(peerId)) {
        console.log(`Max connection attempts reached for peer ${peerId}`);
        return null;
      }
      
      // Increment connection attempts
      this.retryManager.incrementAttempts(peerId);

      // Check if already connected - if so, return the existing connection
      const isConnected = this.peerManager.isConnected(peerId);
      if (isConnected) {
        console.log(`Already connected to peer ${peerId}`);
        return this.peerManager.getPeerConnection(peerId);
      }

      // Get existing connection or create new one
      let connection = this.peerManager.getPeerConnection(peerId);
      const needsNewConnection = !connection || 
          connection.connection.connectionState === 'failed' || 
          connection.connection.connectionState === 'closed' || 
          connection.connection.connectionState === 'disconnected';
          
      if (needsNewConnection) {
        console.log(`Creating new connection to peer ${peerId}`);
        try {
          connection = await this.peerManager.createPeer(peerId);
          
          // Set a timeout to check connection status and attempt reconnect if needed
          this.timeoutManager.setTimeout(peerId, () => {
            const currentConnection = this.peerManager.getPeerConnection(peerId);
            if (currentConnection && 
                (currentConnection.connection.connectionState === 'failed' || 
                 currentConnection.connection.connectionState === 'closed' || 
                 currentConnection.connection.connectionState === 'disconnected')) {
              console.log(`Connection to peer ${peerId} failed, attempting reconnect`);
              this.connectToPeer(peerId, peerPublicKey);
            }
          }, 5000); // Check after 5 seconds
        } catch (createError) {
          console.error(`Error creating peer connection to ${peerId}:`, createError);
          throw createError;
        }
      }

      // Establish secure connection if we don't already have one
      if (this.localKeyPair) {
        await this.secureConnectionManager.establishSecureConnection(
          peerId,
          this.localKeyPair.publicKey,
          this.localKeyPair.privateKey,
          peerPublicKey
        );
      }

      // Schedule retry reset
      this.retryManager.scheduleRetryReset(peerId);

      return connection;
    } catch (error) {
      console.error('Error connecting to peer:', error);
      throw error;
    }
  }

  public disconnect(peerId: string) {
    console.log(`Disconnecting from peer ${peerId}`);
    
    // Clear any pending timeouts
    this.timeoutManager.clearTimeout(peerId);
    
    // Disconnect peer and clean up
    this.peerManager.disconnect(peerId);
    this.secureConnectionManager.removeSecureConnection(peerId);
    this.retryManager.resetAttempts(peerId);
  }

  public disconnectAll() {
    console.log('Disconnecting from all peers');
    
    // Clear all timeouts
    this.timeoutManager.clearAllTimeouts();
    
    // Disconnect all peers and clean up
    this.peerManager.disconnectAll();
    this.secureConnectionManager.clearAllSecureConnections();
    this.retryManager.resetAllAttempts();
  }

  public getConnectionState(peerId: string): string {
    const connection = this.peerManager.getPeerConnection(peerId);
    if (!connection) return 'disconnected';
    
    return connection.connection.connectionState || 'unknown';
  }
  
  public getDataChannelState(peerId: string): string {
    const connection = this.peerManager.getPeerConnection(peerId);
    if (!connection || !connection.dataChannel) return 'closed';
    
    return connection.dataChannel.readyState || 'unknown';
  }
  
  public async attemptReconnect(peerId: string, publicKey: JsonWebKey) {
    console.log(`Attempting to reconnect with peer ${peerId}`);
    
    // Reset connection attempts for this peer
    this.retryManager.resetAttempts(peerId);
    
    // Clean up existing connection
    this.peerManager.disconnect(peerId);
    
    // Attempt new connection with exponential backoff
    let attempt = 0;
    const maxRetries = 3;
    let success = false;
    
    while (attempt < maxRetries && !success) {
      try {
        const connection = await this.connectToPeer(peerId, publicKey);
        
        // Wait for the connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        
        const connectionState = this.getConnectionState(peerId);
        const dataChannelState = this.getDataChannelState(peerId);
        
        if (connectionState === 'connected' && dataChannelState === 'open') {
          success = true;
          console.log(`Successfully reconnected to peer ${peerId}`);
          return connection;
        }
        
        console.log(`Connection attempt ${attempt + 1} for peer ${peerId} not yet successful, retrying...`);
      } catch (error) {
        console.error(`Reconnection attempt ${attempt + 1} to peer ${peerId} failed:`, error);
      }
      
      attempt++;
      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    
    if (!success) {
      console.log(`All reconnection attempts to peer ${peerId} failed`);
      throw new Error(`Failed to reconnect to peer ${peerId} after ${maxRetries} attempts`);
    }
    
    return this.peerManager.getPeerConnection(peerId);
  }
}
