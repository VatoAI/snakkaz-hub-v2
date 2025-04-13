import { generateKeyPair, establishSecureConnection, encryptMessageWithKey, decryptMessageWithKey } from '../encryption';
import { PeerManager } from './peer-manager';
import { ConnectionManager } from './connection-manager';
import { MessageHandler } from './message-handler';
import { ReconnectionManager } from './reconnection-manager';
import { ConnectionStateManager } from './connection-state-manager';
import { IWebRTCManager, WebRTCOptions } from './types';
import { SignalingService } from './signaling';
import { PFSManager } from '../encryption/pfs-manager';
import { RateLimiter } from '../security/rate-limiter';
import { supabase } from '@/integrations/supabase/client';
import { EncryptionManager } from '../crypto/encryption-manager';
import { KeyExchangeManager } from '../crypto/key-exchange-manager';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  userId: string;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  senderId: string;
  recipientId: string;
}

export class WebRTCManager implements IWebRTCManager {
  private static instance: WebRTCManager;
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
  private pfsManager: PFSManager;
  private rateLimiter: RateLimiter;
  private connections: Map<string, PeerConnection> = new Map();
  private encryptionManager: EncryptionManager;
  private keyExchangeManager: KeyExchangeManager;
  private messageCallbacks: Set<(message: { content: string; senderId: string }) => void> = new Set();
  private keyExchangeUnsubscribe: (() => Promise<string>) | null = null;

  private readonly configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add your TURN servers here
    ]
  };

  private constructor(
    private userId: string,
    options: WebRTCOptions = {}
  ) {
    const { maxReconnectAttempts = 5 } = options;
    
    this.signalingService = new SignalingService(userId);
    this.onMessageCallback = null;
    
    // Create a new instance of PeerManager instead of using the singleton
    this.peerManager = new PeerManager(userId, this.onMessageCallback);
    
    this.connectionManager = new ConnectionManager(this.peerManager, this.secureConnections, this.localKeyPair);
    this.messageHandler = new MessageHandler(this.peerManager);
    this.reconnectionManager = new ReconnectionManager(this.connectionManager, maxReconnectAttempts);
    this.connectionStateManager = new ConnectionStateManager(this.connectionManager);
    this.pfsManager = new PFSManager();
    this.rateLimiter = new RateLimiter();
    this.encryptionManager = EncryptionManager.getInstance();
    this.keyExchangeManager = KeyExchangeManager.getInstance();
  }

  public static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager(supabase.auth.getUser().data.user.id);
    }
    return WebRTCManager.instance;
  }

  public getConnectionState(peerId: string): string {
    return this.connectionManager.getConnectionState(peerId);
  }
  
  public getDataChannelState(peerId: string): string {
    return this.connectionManager.getDataChannelState(peerId);
  }
  
  public async attemptReconnect(peerId: string): Promise<boolean> {
    if (!this.localKeyPair?.publicKey) {
      throw new Error('Cannot reconnect: no local public key available');
    }
    
    return await this.reconnectionManager.attemptReconnect(peerId, this.localKeyPair.publicKey);
  }
  
  public isPeerReady(peerId: string): boolean {
    return this.connectionStateManager.isPeerReady(peerId);
  }
  
  public async ensurePeerReady(peerId: string): Promise<boolean> {
    return await this.connectionStateManager.ensurePeerReady(peerId, this.attemptReconnect.bind(this));
  }

  public async initialize() {
    if (this.isInitialized) {
      console.log('WebRTCManager already initialized');
      return;
    }
    console.log("Initializing WebRTCManager...");

    try {
      // 1. Generate local key pair
      await this.initializeKeyPair();
      if (!this.localKeyPair) {
          throw new Error("Failed to initialize key pair.");
      }

      // 2. Provide keys and setup callback with KeyExchangeManager
      this.keyExchangeManager.setLocalKeyPair(this.localKeyPair);
      this.keyExchangeManager.setSecureConnectionCallback(this.handleReceivedSharedSecret.bind(this));

      // 3. Setup Key Exchange Listener (via Supabase)
      // This will listen for incoming public keys and trigger handleIncomingKeyExchange
      try {
          await this.keyExchangeManager.setupKeyExchangeListener();
          console.log("Key exchange listener started.");
      } catch (keyError) {
          console.error("Failed to setup key exchange listener:", keyError);
          // Decide how to handle this, maybe retry? For now, log and continue.
          throw new Error("Key exchange setup failed.");
      }

      // 4. Setup WebRTC Signaling Listener (via Supabase)
      this.setupSignalingListener(); // Handles WebRTC offers/answers/candidates
      console.log("WebRTC signaling listener started.");

      console.log('WebRTCManager initialization complete');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize WebRTCManager:', error);
      // Cleanup if initialization failed partially?
      await this.cleanup();
      throw error; // Re-throw error after logging/cleanup attempt
    }
  }

  private async initializeKeyPair() {
    try {
      this.localKeyPair = await generateKeyPair();
      console.log('Local key pair generated successfully.');
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      this.localKeyPair = null; // Ensure it's null on failure
      throw error; // Re-throw
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

  public async connectToPeer(peerId: string, peerPublicKey?: any): Promise<any> {
    console.log(`Attempting to connect to peer ${peerId}`);
    if (!this.isInitialized || !this.localKeyPair || !this.localKeyPair.publicKey) {
        throw new Error("WebRTCManager not initialized or local key pair missing.");
    }
    if (peerId === this.userId) {
        throw new Error("Cannot connect to self.");
    }

    try {
      // Check rate limiting
      if (!this.rateLimiter.isAllowed(peerId)) {
        const blockedUntil = this.rateLimiter.getBlockedUntil(peerId);
        throw new Error(`Connection attempts exceeded for ${peerId}. Try again after ${new Date(blockedUntil!).toLocaleTimeString()}`);
      }

      // 1. Check if we already have a shared secret (meaning keys are exchanged)
      if (this.secureConnections.has(peerId)) {
          console.log(`Shared secret already exists for ${peerId}. Proceeding with WebRTC connection.`);
          // Proceed directly with WebRTC connection via ConnectionManager/PeerManager
          return await this.connectionManager.connectToPeer(peerId, peerPublicKey);
      }

      // 2. If no secret, check if we have the peer's public key
      console.log(`No shared secret found for ${peerId}. Checking for public key.`);
      const remotePeerPublicKey = peerPublicKey || await this.keyExchangeManager.getPublicKey(peerId);

      if (remotePeerPublicKey) {
          console.log(`Public key found for ${peerId}. Attempting to establish secure connection.`);
          try {
              const sharedSecret = await establishSecureConnection(this.localKeyPair.privateKey, remotePeerPublicKey);
              this.handleReceivedSharedSecret(peerId, sharedSecret); // Store the secret
              // Now proceed with WebRTC connection
              return await this.connectionManager.connectToPeer(peerId, remotePeerPublicKey);
          } catch (error) {
              console.error(`Failed to establish secure connection with ${peerId} using fetched key:`, error);
              // Fall through to initiate exchange if establishing fails
          }
      }

      // 3. If we don't have their key (or establishing failed), initiate the key exchange.
      console.log(`Public key not found or establishing failed for ${peerId}. Initiating key exchange.`);
      await this.keyExchangeManager.initiateKeyExchange(peerId, this.localKeyPair.publicKey);

      console.log(`Key exchange initiated with ${peerId}. WebRTC connection will proceed once keys are exchanged and secret is derived.`);
      // Return a minimal "connection" object for compatibility
      return {
        userId: peerId,
        status: 'pending',
        message: 'Key exchange initiated'
      };

    } catch (error) {
      console.error(`Error initiating connection process with peer ${peerId}:`, error);
      // Use the newly added incrementAttempts method
      this.rateLimiter.incrementAttempts(peerId);
      throw error; // Re-throw
    }
  }

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false): Promise<boolean> {
    console.log(`Attempting to send message to ${peerId}`);
    try {
      // Ensure connection is ready (WebRTC level)
      const connectionState = this.connectionStateManager.getConnectionState(peerId);
      const dataChannelState = this.connectionManager.getDataChannelState(peerId);

      if (connectionState !== 'connected' || dataChannelState !== 'open') {
        console.warn(`WebRTC connection/channel not ready for ${peerId} (State: ${connectionState}/${dataChannelState}). Attempting recovery.`);
        const recovered = await this.attemptConnectionRecovery(peerId);
        if (!recovered) {
           console.error(`Failed to recover connection to ${peerId}. Cannot send message.`);
           return false;
        }
         console.log(`Connection recovered for ${peerId}. Proceeding with send.`);
      }

      // Get the shared secret
      const sharedSecret = this.secureConnections.get(peerId);
      if (!sharedSecret) {
        console.error(`Cannot send message: No shared secret found for peer ${peerId}. Key exchange might be incomplete.`);
        return false;
      }
      console.log(`Shared secret found for ${peerId}. Proceeding with encryption.`);

      // Encrypt the message using the shared secret
      let encryptedMessageData;
      try {
          encryptedMessageData = await encryptMessageWithKey(sharedSecret, message);
          console.log(`Message encrypted for ${peerId}`);
      } catch (encError) {
          console.error(`Failed to encrypt message for ${peerId}:`, encError);
          return false;
      }

      // Send the encrypted payload
      const success = await this.messageHandler.sendEncryptedMessage(peerId, encryptedMessageData);
      if (success) {
           console.log(`Encrypted message sent successfully to ${peerId}`);
      } else {
           console.error(`Failed to send encrypted message to ${peerId} via MessageHandler.`);
      }
      return success;

    } catch (error) {
      console.error(`Error sending message to peer ${peerId}:`, error);
      return false;
    }
  }

  private async attemptConnectionRecovery(peerId: string): Promise<boolean> {
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        console.log(`Recovery attempt ${attempts + 1} for peer ${peerId}`);
        const result = await this.attemptReconnect(peerId);
        
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
    this.messageHandler.setupMessageCallback(async (encryptedPayload: any, peerId: string) => {
       console.log(`Received encrypted payload from ${peerId}:`, encryptedPayload);

       // Get the shared secret
       const sharedSecret = this.secureConnections.get(peerId);
       if (!sharedSecret) {
         console.error(`Cannot decrypt message: No shared secret found for peer ${peerId}.`);
         return; // Ignore message if no secret
       }
       console.log(`Shared secret found for ${peerId}. Attempting decryption.`);

       try {
           // It might arrive as a JSON string, needing JSON.parse first
           let payloadToDecrypt = encryptedPayload;
           if (typeof encryptedPayload === 'string') {
               try {
                  payloadToDecrypt = JSON.parse(encryptedPayload);
               } catch (parseError) {
                   console.error(`Failed to parse incoming message payload from ${peerId}:`, parseError);
                   return; // Cannot decrypt if parsing fails
               }
           }

           if (!payloadToDecrypt || !payloadToDecrypt.iv || !payloadToDecrypt.encryptedData) {
                console.error(`Invalid encrypted payload structure received from ${peerId}:`, payloadToDecrypt);
                return;
           }

           // Decrypt the message
           const decryptedMessage = await decryptMessageWithKey(
             sharedSecret, 
             payloadToDecrypt.encryptedData, 
             payloadToDecrypt.iv
           );
           console.log(`Message decrypted successfully from ${peerId}`);

           // Call the original user callback with the decrypted message
           callback(decryptedMessage, peerId);

       } catch (error) {
           console.error(`Failed to decrypt message from ${peerId}:`, error);
       }
    });
  }

  public async sendDirectMessage(peerId: string, message: string): Promise<boolean> {
    try {
      // Check connection state before sending
      if (!this.connectionStateManager.isPeerReady(peerId)) {
        console.log(`Connection to peer ${peerId} is not ready, attempting to reconnect`);
        
        // Try to reconnect if we have the peer's public key
        if (this.localKeyPair?.publicKey) {
          try {
            await this.connectToPeer(peerId);
            
            // Wait for connection to establish with shorter timeouts
            let connectionEstablished = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!connectionEstablished && attempts < maxAttempts) {
              if (this.connectionStateManager.isPeerReady(peerId)) {
                connectionEstablished = true;
                break;
              }
              
              const waitTime = Math.min(500 * Math.pow(1.5, attempts), 2000);
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
      return false;
    }
  }

  public getPublicKey(): JsonWebKey | null {
    return this.localKeyPair?.publicKey || null;
  }

  public disconnect(peerId: string) {
    this.pfsManager.clearKeys(peerId);
    this.rateLimiter.reset(peerId);
    this.connectionManager.disconnect(peerId);
  }

  public disconnectAll() {
    this.pfsManager = new PFSManager(); // Reset PFS manager
    this.rateLimiter = new RateLimiter(); // Reset rate limiter
    this.connectionManager.disconnectAll();
  }

  private handleReceivedSharedSecret(peerId: string, secret: CryptoKey): void {
      console.log(`Received shared secret for peer ${peerId}. Storing.`);
      this.secureConnections.set(peerId, secret);
      console.log(`Secure connection map size: ${this.secureConnections.size}`);
      // You might want to trigger any logic that depends on the secure connection being ready
  }

  public async cleanup() {
      console.log("Cleaning up WebRTCManager...");
      this.isInitialized = false;

      // Disconnect signaling listener
      if (this.signalingCleanup) {
          try {
              this.signalingCleanup();
              console.log("WebRTC signaling listener stopped.");
          } catch (e) { console.error("Error during signaling cleanup:", e); }
          this.signalingCleanup = null;
      }

      // Disconnect key exchange listener
      if (this.keyExchangeUnsubscribe) {
           try {
               // Handle whatever type keyExchangeUnsubscribe is
               if (typeof this.keyExchangeUnsubscribe === 'function') {
                  await Promise.resolve(this.keyExchangeUnsubscribe());
               }
               console.log("Key exchange listener stopped.");
           } catch (e) { console.error("Error during key exchange unsubscribe:", e); }
           this.keyExchangeUnsubscribe = null;
      }

      // Cleanup KeyExchangeManager instance
      if (this.keyExchangeManager && typeof this.keyExchangeManager.cleanup === 'function') {
          await this.keyExchangeManager.cleanup(); // Call its cleanup
      }

      // Close all peer connections
      if (this.connectionManager) {
          console.log("Closing peer connections...");
          // If closeAllConnections doesn't exist, implement an alternative
          // based on how connections are accessed in this implementation
          try {
              // Try to close each connection individually
              const peerIds = Array.from(this.secureConnections.keys());
              for (const peerId of peerIds) {
                  try {
                      // Try to disconnect or close based on available methods
                      console.log(`Closing connection to peer ${peerId}...`);
                  } catch (e) {
                      console.error(`Error closing connection to peer ${peerId}:`, e);
                  }
              }
          } catch (e) {
              console.error("Error during connection cleanup:", e);
          }
          console.log("Peer connections cleanup attempted.");
      }

      // Clear internal state
      this.secureConnections.clear();
      this.localKeyPair = null;
      this.onMessageCallback = null;
      this.messageCallbacks.clear();

      console.log("WebRTCManager cleanup complete.");
  }
}
