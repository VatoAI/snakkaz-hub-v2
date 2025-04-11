import { generateKeyPair } from '../encryption';
import { PeerManager } from './peer-manager';
import { ConnectionManager } from './connection-manager';
import { MessageHandler } from './message-handler';
import { ReconnectionManager } from './reconnection-manager';
import { ConnectionStateManager } from './connection-state-manager';
import { IWebRTCManager, WebRTCOptions } from './webrtc-types';
import { SignalingService } from './signaling';

export class WebRTCManager implements IWebRTCManager {
  private peerManager: PeerManager;
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private reconnectionManager: ReconnectionManager;
  private connectionStateManager: ConnectionStateManager;
  private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  private onMessageCallback: ((message: string, peerId: string) => void) | null = null;
  private secureConnections: Map<string, CryptoKey> = new Map();
  private signalingCleanup: (() => void) | null = null;
  private signalingService: SignalingService;
  private isInitialized: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor(
    private userId: string,
    options: WebRTCOptions = {}
  ) {
    const { maxReconnectAttempts = 5 } = options; // Increased from 3 to 5
    
    this.signalingService = new SignalingService(userId);
    this.peerManager = new PeerManager(userId, this.onMessageCallback);
    this.connectionManager = new ConnectionManager(this.peerManager, this.secureConnections, this.localKeyPair);
    this.messageHandler = new MessageHandler(this.peerManager, this.secureConnections);
    this.reconnectionManager = new ReconnectionManager(this.connectionManager, maxReconnectAttempts);
    this.connectionStateManager = new ConnectionStateManager(this.connectionManager);
    
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
      throw error;
    }
  }

  private setupSignalingListener() {
    if (this.signalingCleanup) {
      this.signalingCleanup();
    }
    
    const cleanup = this.signalingService.setupSignalingListener(
      async (signal) => {
        try {
          await this.peerManager.handleIncomingSignal(signal);
        } catch (error) {
          console.error('Error handling incoming signal:', error);
        }
      }
    );
    
    this.signalingCleanup = cleanup;
    return cleanup;
  }

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey) {
    try {
      return await this.connectionManager.connectToPeer(peerId, peerPublicKey);
    } catch (error) {
      console.error(`Error connecting to peer ${peerId}:`, error);
      throw error;
    }
  }

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false) {
    try {
      // Add connection state check before sending
      const connectionState = this.connectionStateManager.getConnectionState(peerId);
      if (connectionState !== 'connected') {
        console.log(`Connection not ready (${connectionState}), attempting recovery`);
        await this.attemptConnectionRecovery(peerId);
      }

      return await this.messageHandler.sendMessage(peerId, message, isDirect);
    } catch (error) {
      console.error(`Error sending message to peer ${peerId}:`, error);
      
      // Enhanced error recovery
      if (this.localKeyPair?.publicKey) {
        try {
          console.log(`Attempting connection recovery for peer ${peerId}`);
          await this.attemptConnectionRecovery(peerId);
          // If recovery worked, try sending again
          return await this.messageHandler.sendMessage(peerId, message, isDirect);
        } catch (recoveryError) {
          console.error(`Connection recovery failed for peer ${peerId}:`, recoveryError);
          throw new Error(`Failed to send message: ${error.message}`);
        }
      } else {
        throw new Error(`Cannot recover connection: no local key pair`);
      }
    }
  }

  private async attemptConnectionRecovery(peerId: string): Promise<boolean> {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        console.log(`Recovery attempt ${attempts + 1} for peer ${peerId}`);
        await this.attemptReconnect(peerId);
        
        // Wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const connectionState = this.connectionStateManager.getConnectionState(peerId);
        const dataChannelState = this.connectionStateManager.getDataChannelState(peerId);
        
        if (connectionState === 'connected' && dataChannelState === 'open') {
          console.log(`Successfully recovered connection to peer ${peerId}`);
          return true;
        }
        
        attempts++;
      } catch (error) {
        console.error(`Recovery attempt ${attempts + 1} failed:`, error);
        attempts++;
      }
    }

    console.error(`Failed to recover connection after ${maxAttempts} attempts`);
    return false;
  }

  public onMessage(callback: (message: string, peerId: string) => void) {
    this.onMessageCallback = callback;
    this.messageHandler.setupMessageCallback(callback);
  }

  public async sendDirectMessage(peerId: string, message: string) {
    try {
      // Check connection state before sending
      if (!this.connectionStateManager.isPeerReady(peerId)) {
        console.log(`Connection to peer ${peerId} is not ready, attempting to reconnect`);
        
        // Try to reconnect if we have the peer's public key
        if (this.localKeyPair?.publicKey) {
          try {
            await this.connectToPeer(peerId, this.localKeyPair.publicKey);
            
            // Wait for connection to establish with shorter timeouts
            let connectionEstablished = false;
            let attempts = 0;
            const maxAttempts = 3; // Reduced from 5 to 3
            
            while (!connectionEstablished && attempts < maxAttempts) {
              if (this.connectionStateManager.isPeerReady(peerId)) {
                connectionEstablished = true;
                break;
              }
              
              // Use shorter wait times for faster connection
              const waitTime = Math.min(500 * Math.pow(1.5, attempts), 2000); // Reduced from 1000ms to 500ms base
              await new Promise(resolve => setTimeout(resolve, waitTime));
              attempts++;
            }
            
            if (!connectionEstablished) {
              throw new Error(`Could not establish connection with peer ${peerId} after ${maxAttempts} attempts`);
            }
          } catch (reconnectError) {
            console.error(`Reconnection to peer ${peerId} failed:`, reconnectError);
            throw new Error(`Failed to establish connection with peer ${peerId}`);
          }
        } else {
          throw new Error('Cannot reconnect: no local public key available');
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
  
  // Method to try reconnecting with a peer with improved error handling
  public async attemptReconnect(peerId: string) {
    if (!this.localKeyPair?.publicKey) {
      throw new Error('Cannot reconnect: no local public key available');
    }
    
    return await this.reconnectionManager.attemptReconnect(peerId, this.localKeyPair.publicKey);
  }
  
  // Method to check if a peer is connected and ready for messaging
  public isPeerReady(peerId: string): boolean {
    return this.connectionStateManager.isPeerReady(peerId);
  }
  
  // Try to ensure a peer is ready, reconnecting if necessary
  public async ensurePeerReady(peerId: string): Promise<boolean> {
    return await this.connectionStateManager.ensurePeerReady(peerId, this.attemptReconnect.bind(this));
  }

  public async initialize() {
    if (this.isInitialized) {
      console.log('WebRTCManager already initialized');
      return;
    }

    try {
      // Generate key pair for secure connections
      await this.initializeKeyPair();
      
      // Setup signaling channel
      this.setupSignalingListener();
      
      // Verify Supabase connection
      const { data, error } = await this.signalingService.verifyConnection();
      if (error) {
        throw error;
      }
      console.log('Supabase connection verified');

      this.isInitialized = true;
      console.log('WebRTC setup complete');
    } catch (error) {
      console.error('Error initializing WebRTCManager:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(async () => {
      console.log('Attempting to reconnect WebRTC...');
      try {
        await this.initialize();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.scheduleReconnect();
      }
    }, this.RECONNECT_DELAY);
  }

  private async handleKeyExchange(peerId: string, data: any) {
    try {
      if (!this.localKeyPair) {
        throw new Error('Local key pair not initialized');
      }

      const sharedKey = await this.peerManager.establishSecureConnection(
        peerId,
        data,
        this.localKeyPair
      );

      if (sharedKey) {
        this.secureConnections.set(peerId, sharedKey);
      }
    } catch (error) {
      console.error('Error handling key exchange:', error);
    }
  }

  public async disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    try {
      await this.signalingService.disconnect();
      this.peerManager.disconnectAll();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  public isConnected(): boolean {
    return this.isInitialized;
  }

  public getConnectedPeers(): string[] {
    return this.peerManager.getConnectedPeerIds();
  }
}
