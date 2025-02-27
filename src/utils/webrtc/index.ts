
import { generateKeyPair, establishSecureConnection, encryptMessage, decryptMessage } from '../encryption';
import { PeerManager } from './peer-manager';

export class WebRTCManager {
  private peerManager: PeerManager;
  private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  private onMessageCallback: ((message: string, peerId: string) => void) | null = null;
  private secureConnections: Map<string, CryptoKey> = new Map();
  private connectionAttempts: Map<string, number> = new Map();
  private maxConnectionAttempts = 3;

  constructor(private userId: string) {
    this.peerManager = new PeerManager(userId);
    this.initializeKeyPair();
    this.setupSignalingListener();
  }

  private async initializeKeyPair() {
    try {
      this.localKeyPair = await generateKeyPair();
      console.log('Local key pair generated');
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    }
  }

  private setupSignalingListener() {
    return this.peerManager.signalingService.setupSignalingListener(
      async (signal) => await this.peerManager.handleIncomingSignal(signal)
    );
  }

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

      // Check if already connected
      if (this.peerManager.isConnected(peerId)) {
        console.log(`Already connected to peer ${peerId}`);
        return this.peerManager.getPeerConnection(peerId);
      }

      // Get existing connection or create new one
      let connection = this.peerManager.getPeerConnection(peerId);
      if (!connection || 
          connection.connection.connectionState === 'failed' || 
          connection.connection.connectionState === 'closed') {
        connection = await this.peerManager.createPeer(peerId);
      }

      // Establish secure connection if we don't already have one
      if (!this.secureConnections.has(peerId)) {
        const secureConnection = await establishSecureConnection(
          this.localKeyPair.publicKey,
          this.localKeyPair.privateKey,
          peerPublicKey
        );
        this.secureConnections.set(peerId, secureConnection);
      }

      return connection;
    } catch (error) {
      console.error('Error connecting to peer:', error);
      throw error;
    }
  }

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false) {
    const connection = this.peerManager.getPeerConnection(peerId);
    if (!connection || !connection.dataChannel) {
      throw new Error('No connection found for peer');
    }

    try {
      let messageToSend = message;
      
      if (isDirect) {
        // Use E2EE for direct messages
        const secureConnection = this.secureConnections.get(peerId);
        if (!secureConnection) {
          throw new Error('No secure connection established with peer');
        }
        
        const { encryptedContent, key, iv } = await encryptMessage(message);
        messageToSend = JSON.stringify({
          type: 'direct',
          content: encryptedContent,
          key: key,
          iv: iv
        });
      } else {
        // For regular messages, just wrap with type
        messageToSend = JSON.stringify({
          type: 'regular',
          content: message
        });
      }
      
      connection.dataChannel.send(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  public onMessage(callback: (message: string, peerId: string) => void) {
    this.onMessageCallback = callback;
    this.peerManager = new PeerManager(this.userId, async (messageData, peerId) => {
      try {
        // Parse the incoming message
        const parsedMessage = JSON.parse(messageData);
        
        if (parsedMessage.type === 'direct') {
          // Handle direct encrypted message
          const decryptedMessage = await decryptMessage(
            parsedMessage.content,
            parsedMessage.key,
            parsedMessage.iv
          );
          callback(`[Privat] ${decryptedMessage}`, peerId);
        } else {
          // Handle regular message
          callback(parsedMessage.content, peerId);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        callback(messageData, peerId); // Fallback to raw message
      }
    });
    
    // Re-initialize the signaling listener with the new peer manager
    this.setupSignalingListener();
  }

  public async sendDirectMessage(peerId: string, message: string) {
    return this.sendMessage(peerId, message, true);
  }

  public getPublicKey(): JsonWebKey | null {
    return this.localKeyPair?.publicKey || null;
  }

  public disconnect(peerId: string) {
    this.peerManager.disconnect(peerId);
    this.secureConnections.delete(peerId);
    this.connectionAttempts.delete(peerId);
  }

  public disconnectAll() {
    this.peerManager.disconnectAll();
    this.secureConnections.clear();
    this.connectionAttempts.clear();
  }
}

export const createWebRTCManager = (userId: string) => new WebRTCManager(userId);
