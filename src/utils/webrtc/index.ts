
import { generateKeyPair } from '../encryption';
import { PeerManager } from './peer-manager';
import { ConnectionManager } from './connection-manager';
import { MessageHandler } from './message-handler';

export class WebRTCManager {
  private peerManager: PeerManager;
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  private onMessageCallback: ((message: string, peerId: string) => void) | null = null;
  private secureConnections: Map<string, CryptoKey> = new Map();
  private signalingCleanup: (() => void) | null = null;

  constructor(private userId: string) {
    this.peerManager = new PeerManager(userId);
    this.connectionManager = new ConnectionManager(this.peerManager, this.secureConnections, this.localKeyPair);
    this.messageHandler = new MessageHandler(this.peerManager, this.secureConnections);
    this.initializeKeyPair();
    this.setupSignalingListener();
  }

  private async initializeKeyPair() {
    try {
      this.localKeyPair = await generateKeyPair();
      console.log('Local key pair generated');
      // Update connectionManager with the new keyPair
      this.connectionManager = new ConnectionManager(this.peerManager, this.secureConnections, this.localKeyPair);
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    }
  }

  private setupSignalingListener() {
    if (this.signalingCleanup) {
      this.signalingCleanup();
    }
    
    this.signalingCleanup = this.peerManager.signalingService.setupSignalingListener(
      async (signal) => await this.peerManager.handleIncomingSignal(signal)
    );
    
    return this.signalingCleanup;
  }

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey) {
    return this.connectionManager.connectToPeer(peerId, peerPublicKey);
  }

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false) {
    return this.messageHandler.sendMessage(peerId, message, isDirect);
  }

  public onMessage(callback: (message: string, peerId: string) => void) {
    this.onMessageCallback = callback;
    
    // Create a new message handler callback
    const messageCallback = this.messageHandler.setupMessageCallback(callback);
    
    // Create a new PeerManager with the callback
    this.peerManager = new PeerManager(this.userId, messageCallback);
    
    // Recreate dependent objects with the new PeerManager
    this.connectionManager = new ConnectionManager(this.peerManager, this.secureConnections, this.localKeyPair);
    this.messageHandler = new MessageHandler(this.peerManager, this.secureConnections);
    
    // Re-initialize the signaling listener with the new peer manager
    this.setupSignalingListener();
  }

  public async sendDirectMessage(peerId: string, message: string) {
    try {
      // Check connection state before sending
      const connection = this.peerManager.getPeerConnection(peerId);
      if (!connection || 
          !connection.dataChannel || 
          connection.dataChannel.readyState !== 'open' ||
          connection.connection.connectionState !== 'connected') {
        console.log(`Connection to peer ${peerId} is not ready, attempting to reconnect`);
        
        // Try to reconnect if we have the peer's public key
        if (this.localKeyPair?.publicKey) {
          await this.connectToPeer(peerId, this.localKeyPair.publicKey);
          
          // Wait for connection to establish
          let attempts = 0;
          while (attempts < 5) {
            const updatedConnection = this.peerManager.getPeerConnection(peerId);
            if (updatedConnection && 
                updatedConnection.dataChannel && 
                updatedConnection.dataChannel.readyState === 'open') {
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
        }
      }
      
      return await this.messageHandler.sendDirectMessage(peerId, message);
    } catch (error) {
      console.error(`Failed to send direct message to ${peerId}:`, error);
      throw error;
    }
  }

  public getPublicKey(): JsonWebKey | null {
    return this.localKeyPair?.publicKey || null;
  }

  public disconnect(peerId: string) {
    this.connectionManager.disconnect(peerId);
  }

  public disconnectAll() {
    this.connectionManager.disconnectAll();
  }
  
  public getConnectionState(peerId: string): string {
    return this.connectionManager.getConnectionState(peerId);
  }
  
  public getDataChannelState(peerId: string): string {
    return this.connectionManager.getDataChannelState(peerId);
  }
  
  // Method to try reconnecting with a peer
  public async attemptReconnect(peerId: string) {
    if (!this.localKeyPair?.publicKey) {
      throw new Error('Cannot reconnect: no local public key available');
    }
    
    return this.connectionManager.attemptReconnect(peerId, this.localKeyPair.publicKey);
  }
}

export const createWebRTCManager = (userId: string) => new WebRTCManager(userId);
