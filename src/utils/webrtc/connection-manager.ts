import { PeerManager } from './peer-manager';
import { PeerConnection } from './peer-connection';
import { RTCConfig } from './rtc-config';
import { SignalingService } from './signaling';

export class ConnectionManager {
  private connections: Map<string, PeerConnection> = new Map();
  private signalingService: SignalingService;

  constructor(
    private peerManager: PeerManager,
    private secureConnections: Map<string, CryptoKey>,
    private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null
  ) {
    this.signalingService = new SignalingService(peerManager.getUserId());
  }

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey): Promise<PeerConnection | null> {
    try {
      console.log(`Attempting to connect to peer ${peerId}`);
      
      // Check if we already have a connection
      let connection = this.peerManager.getConnection(peerId);
      
      if (connection && connection.connection.connectionState === 'connected') {
        console.log(`Already connected to peer ${peerId}`);
        return connection;
      }
      
      // Create a new connection if none exists or if the existing one is closed
      if (!connection || 
          connection.connection.connectionState === 'closed' || 
          connection.connection.connectionState === 'failed') {
        console.log(`Creating new connection to peer ${peerId}`);
        connection = await this.peerManager.createPeer(peerId);
        
        // Create a data channel for this connection
        const dataChannel = connection.connection.createDataChannel(`channel-${peerId}`, {
          ordered: true,
          maxRetransmits: 3
        });
        
        connection.setDataChannel(dataChannel);
        
        // Set up data channel event handlers
        dataChannel.onopen = () => {
          console.log(`Data channel to peer ${peerId} opened`);
        };
        
        dataChannel.onclose = () => {
          console.log(`Data channel to peer ${peerId} closed`);
        };
        
        dataChannel.onerror = (error) => {
          console.error(`Data channel error with peer ${peerId}:`, error);
        };
      }
      
      return connection;
    } catch (error) {
      console.error(`Error connecting to peer ${peerId}:`, error);
      return null;
    }
  }

  public disconnect(peerId: string): void {
    this.peerManager.disconnect(peerId);
  }

  public disconnectAll(): void {
    this.peerManager.disconnectAll();
  }

  public getConnection(peerId: string): PeerConnection | undefined {
    return this.peerManager.getConnection(peerId);
  }

  public getConnectionState(peerId: string): string {
    const connection = this.peerManager.getConnection(peerId);
    if (!connection) {
      return 'disconnected';
    }
    return connection.connection.connectionState;
  }

  public getDataChannelState(peerId: string): string {
    const connection = this.peerManager.getConnection(peerId);
    if (!connection || !connection.dataChannel) {
      return 'closed';
    }
    return connection.dataChannel.readyState;
  }

  public async reconnect(peerId: string): Promise<boolean> {
    try {
      // Disconnect first to clean up any existing connection
      this.disconnect(peerId);
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Attempt to reconnect if we have the public key
      if (this.localKeyPair?.publicKey) {
        const connection = await this.connectToPeer(peerId, this.localKeyPair.publicKey);
        return !!connection;
      }
      
      return false;
    } catch (error) {
      console.error(`Error reconnecting to peer ${peerId}:`, error);
      return false;
    }
  }

  public async createSecureConnection(peerId: string, remotePublicKey: JsonWebKey): Promise<CryptoKey | null> {
    if (!this.localKeyPair) {
      console.error('No local key pair available for secure connection');
      return null;
    }
    
    try {
      // Import the remote public key
      const importedPublicKey = await crypto.subtle.importKey(
        'jwk',
        remotePublicKey,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        []
      );
      
      // Import the local private key
      const importedPrivateKey = await crypto.subtle.importKey(
        'jwk',
        this.localKeyPair.privateKey,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        ['deriveKey', 'deriveBits']
      );
      
      // Derive a shared secret using ECDH
      const sharedSecret = await crypto.subtle.deriveBits(
        {
          name: 'ECDH',
          public: importedPublicKey
        },
        importedPrivateKey,
        256
      );
      
      // Convert the shared secret to an AES key
      const sharedKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Store the secure connection
      this.secureConnections.set(peerId, sharedKey);
      
      return sharedKey;
    } catch (error) {
      console.error(`Error creating secure connection with peer ${peerId}:`, error);
      return null;
    }
  }
}
