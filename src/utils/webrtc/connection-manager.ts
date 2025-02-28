
import { PeerManager } from './peer-manager';
import { establishSecureConnection } from '../encryption';

export class ConnectionManager {
  private connectionAttempts: Map<string, number> = new Map();
  private maxConnectionAttempts = 5;
  private retryTimeout: number = 10000; // 10 seconds between retry attempts
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private peerManager: PeerManager,
    private secureConnections: Map<string, CryptoKey>,
    private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null
  ) {}

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey) {
    if (!this.localKeyPair) {
      throw new Error('Local key pair not initialized');
    }

    try {
      // Check if we've exceeded max connection attempts
      const attempts = this.connectionAttempts.get(peerId) || 0;
      if (attempts >= this.maxConnectionAttempts) {
        console.log(`Max connection attempts reached for peer ${peerId}`);
        return null;
      }
      
      // Increment connection attempts
      this.connectionAttempts.set(peerId, attempts + 1);

      // Check if already connected - if so, return the existing connection
      if (this.peerManager.isConnected(peerId)) {
        console.log(`Already connected to peer ${peerId}`);
        return this.peerManager.getPeerConnection(peerId);
      }

      // Get existing connection or create new one
      let connection = this.peerManager.getPeerConnection(peerId);
      if (!connection || 
          connection.connection.connectionState === 'failed' || 
          connection.connection.connectionState === 'closed' || 
          connection.connection.connectionState === 'disconnected') {
        console.log(`Creating new connection to peer ${peerId}`);
        connection = await this.peerManager.createPeer(peerId);
        
        // Set a timeout to check connection status and attempt reconnect if needed
        const connectionTimeout = setTimeout(() => {
          const currentConnection = this.peerManager.getPeerConnection(peerId);
          if (currentConnection && 
              (currentConnection.connection.connectionState === 'failed' || 
               currentConnection.connection.connectionState === 'closed' || 
               currentConnection.connection.connectionState === 'disconnected')) {
            console.log(`Connection to peer ${peerId} failed, attempting reconnect`);
            this.connectToPeer(peerId, peerPublicKey);
          }
        }, 5000); // Check after 5 seconds
        
        this.connectionTimeouts.set(peerId, connectionTimeout);
      }

      // Establish secure connection if we don't already have one
      if (!this.secureConnections.has(peerId)) {
        console.log(`Establishing secure connection with peer ${peerId}`);
        const secureConnection = await establishSecureConnection(
          this.localKeyPair.publicKey,
          this.localKeyPair.privateKey,
          peerPublicKey
        );
        this.secureConnections.set(peerId, secureConnection);
      }

      // Set a timeout to clear this connection attempt
      setTimeout(() => {
        const currentAttempts = this.connectionAttempts.get(peerId) || 0;
        if (currentAttempts === attempts + 1) {
          this.connectionAttempts.set(peerId, currentAttempts - 1);
        }
      }, this.retryTimeout);

      return connection;
    } catch (error) {
      console.error('Error connecting to peer:', error);
      throw error;
    }
  }

  public disconnect(peerId: string) {
    console.log(`Disconnecting from peer ${peerId}`);
    
    // Clear any pending connection timeout
    const timeout = this.connectionTimeouts.get(peerId);
    if (timeout) {
      clearTimeout(timeout);
      this.connectionTimeouts.delete(peerId);
    }
    
    this.peerManager.disconnect(peerId);
    this.secureConnections.delete(peerId);
    this.connectionAttempts.delete(peerId);
  }

  public disconnectAll() {
    console.log('Disconnecting from all peers');
    
    // Clear all timeouts
    this.connectionTimeouts.forEach(timeout => clearTimeout(timeout));
    this.connectionTimeouts.clear();
    
    this.peerManager.disconnectAll();
    this.secureConnections.clear();
    this.connectionAttempts.clear();
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
    this.connectionAttempts.set(peerId, 0);
    
    // Clean up existing connection
    this.peerManager.disconnect(peerId);
    
    // Attempt new connection
    return await this.connectToPeer(peerId, publicKey);
  }
}
