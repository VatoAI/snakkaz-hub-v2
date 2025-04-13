import { generateKeyPair } from '../encryption';
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
import { establishSecureConnection, encryptMessage, decryptMessage, JsonWebKey } from '../encryption';

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
    this.messageHandler = new MessageHandler(this.peerManager, this.secureConnections);
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
          this.keyExchangeUnsubscribe = await this.keyExchangeManager.setupKeyExchangeListener();
          console.log("Key exchange listener started.");
      } catch (keyError) {
          console.error("Failed to setup key exchange listener:", keyError);
          // Decide how to handle this, maybe retry? For now, log and continue.
          throw new Error("Key exchange setup failed.");
      }


      // 4. Setup WebRTC Signaling Listener (via Supabase)
      this.setupSignalingListener(); // Handles WebRTC offers/answers/candidates
      console.log("WebRTC signaling listener started.");


      // 5. Verify Supabase connection (for signaling service)
      // Optional: Can be removed if connection is verified elsewhere
      // const { data, error } = await this.signalingService.verifyConnection();
      // if (error) {
      //   throw error;
      // }
      // console.log('Supabase connection verified.');


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
      // Update ConnectionManager ONLY if it needs the key pair *during* construction
      // If ConnectionManager only needs it later, this might not be needed here.
      // Consider if ConnectionManager needs dynamic updates or just reads from secureConnections.
      // this.connectionManager = new ConnectionManager(this.peerManager, this.secureConnections, this.localKeyPair);
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

  public async connectToPeer(peerId: string) {
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
          // This part needs careful implementation in ConnectionManager/PeerManager
          await this.connectionManager.connectToPeer(peerId);
          return; // Assume connectToPeer handles the WebRTC part now
      }

      // 2. If no secret, check if we have the peer's public key
      console.log(`No shared secret found for ${peerId}. Checking for public key.`);
      const peerPublicKey = await this.keyExchangeManager.getPublicKey(peerId);

      if (peerPublicKey) {
          console.log(`Public key found for ${peerId}. Attempting to establish secure connection.`);
          // We have their key, they might have ours. Try establishing the secret.
          // Note: establishSecureConnection is usually called *when receiving* a key.
          // If we fetch their key, we should ensure they also fetch ours or have it.
          // This flow might be better handled by always initiating exchange.
          try {
              const sharedSecret = await establishSecureConnection(this.localKeyPair.privateKey, peerPublicKey);
              this.handleReceivedSharedSecret(peerId, sharedSecret); // Store the secret
              // Now proceed with WebRTC connection
              await this.connectionManager.connectToPeer(peerId);
              return;
          } catch (error) {
              console.error(`Failed to establish secure connection with ${peerId} using fetched key:`, error);
              // Fall through to initiate exchange if establishing fails
          }
      }

      // 3. If we don't have their key (or establishing failed), initiate the key exchange.
      // This sends our public key to the peer via Supabase.
      // The peer's listener (`handleIncomingKeyExchange`) will then:
      //    a) Store our key.
      //    b) Establish the shared secret.
      //    c) Call *their* `handleReceivedSharedSecret` callback.
      //    d) Initiate an exchange *back* to us (sending their public key).
      // Our listener (`handleIncomingKeyExchange`) will then receive their key,
      // establish the secret, and call *our* `handleReceivedSharedSecret`.
      console.log(`Public key not found or establishing failed for ${peerId}. Initiating key exchange.`);
      await this.keyExchangeManager.initiateKeyExchange(peerId, this.localKeyPair.publicKey);

      // What happens next?
      // Option A: Wait here for the secret to appear via the callback (complex, potential deadlocks).
      // Option B: Let initiateKeyExchange trigger the process. The actual WebRTC connection
      //           (offer/answer) should ideally only start *after* the secret is established.
      //           Perhaps `handleReceivedSharedSecret` should trigger the WebRTC connection attempt?
      // For now: We initiate the exchange and let the callback handle storing the secret.
      // The actual sending of offers might need to check `secureConnections.has(peerId)`.

      console.log(`Key exchange initiated with ${peerId}. WebRTC connection will proceed once keys are exchanged and secret is derived.`);
      // Maybe call connectionManager.prepareConnection(peerId) or similar?
      // Or let the UI handle the "connecting..." state until the secret is ready.


    } catch (error) {
      console.error(`Error initiating connection process with peer ${peerId}:`, error);
      this.rateLimiter.incrementAttempts(peerId); // Increment attempts on failure
      throw error; // Re-throw
    }
  }

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false): Promise<boolean> {
    console.log(`Attempting to send message to ${peerId}`);
    try {
      // Ensure connection is ready (WebRTC level)
      const connectionState = this.connectionStateManager.getConnectionState(peerId);
      const dataChannelState = this.connectionStateManager.getDataChannelState(peerId); // Check data channel too

      if (connectionState !== 'connected' || dataChannelState !== 'open') {
        console.warn(`WebRTC connection/channel not ready for ${peerId} (State: ${connectionState}/${dataChannelState}). Attempting recovery.`);
        const recovered = await this.attemptConnectionRecovery(peerId);
        if (!recovered) {
           console.error(`Failed to recover connection to ${peerId}. Cannot send message.`);
           return false;
        }
         console.log(`Connection recovered for ${peerId}. Proceeding with send.`);
      }


      // *** Get the shared secret ***
      const sharedSecret = this.secureConnections.get(peerId);
      if (!sharedSecret) {
        console.error(`Cannot send message: No shared secret found for peer ${peerId}. Key exchange might be incomplete.`);
        // Maybe try initiating key exchange again? Or inform the user.
        // await this.connectToPeer(peerId); // Re-initiate process? Risky.
        return false; // Fail for now
      }
      console.log(`Shared secret found for ${peerId}. Proceeding with encryption.`);


      // Rotate keys if using PFS (PFSManager needs integration with sharedSecret logic)
      // await this.pfsManager.rotateKeys(peerId); // This needs rework for E2EE


      // *** Encrypt the message using the shared secret ***
      let encryptedMessageData;
      try {
          // Assuming encryptMessage takes the secret (CryptoKey) and message (string)
          // and returns an object like { iv: string (base64), encryptedData: string (base64) }
          encryptedMessageData = await encryptMessage(sharedSecret, message);
          console.log(`Message encrypted for ${peerId}`);
      } catch (encError) {
          console.error(`Failed to encrypt message for ${peerId}:`, encError);
          return false;
      }


      // *** Send the encrypted payload ***
      // MessageHandler needs to be adapted to send this structured data.
      // It should probably JSON.stringify the encryptedMessageData object.
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


       // *** Get the shared secret ***
       const sharedSecret = this.secureConnections.get(peerId);
       if (!sharedSecret) {
         console.error(`Cannot decrypt message: No shared secret found for peer ${peerId}.`);
         // Maybe request key exchange? Drop message?
         return; // Ignore message if no secret
       }
       console.log(`Shared secret found for ${peerId}. Attempting decryption.`);


       try {
           // Assuming 'encryptedPayload' is the object { iv: string, encryptedData: string }
           // It might arrive as a JSON string, needing JSON.parse first. Check MessageHandler.
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


           // *** Decrypt the message ***
           // Assuming decryptMessage takes the secret (CryptoKey) and the payload object
           const decryptedMessage = await decryptMessage(sharedSecret, payloadToDecrypt);
           console.log(`Message decrypted successfully from ${peerId}`);


           // *** Call the original user callback with the decrypted message ***
           callback(decryptedMessage, peerId);


       } catch (error) {
           console.error(`Failed to decrypt message from ${peerId}:`, error);
           // Handle decryption failure (e.g., wrong key, corrupted message)
           // Maybe notify the user or log? Don't call the callback.
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
      // Optional: Trigger any logic that depends on the secure connection being ready
      // For example, maybe now we can proceed with the actual WebRTC connection setup if it was pending.
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
               await this.keyExchangeUnsubscribe();
               console.log("Key exchange listener stopped.");
           } catch (e) { console.error("Error during key exchange unsubscribe:", e); }
           this.keyExchangeUnsubscribe = null;
      }


      // Cleanup KeyExchangeManager instance
      if (this.keyExchangeManager) {
          await this.keyExchangeManager.cleanup(); // Call its cleanup
      }


      // Close all peer connections
      if (this.connectionManager) {
          await this.connectionManager.closeAllConnections();
          console.log("All peer connections closed.");
      }


      // Clear internal state
      this.secureConnections.clear();
      this.localKeyPair = null;
      this.onMessageCallback = null;
      this.messageCallbacks.clear();
      // Reset other managers if necessary


      console.log("WebRTCManager cleanup complete.");
  }
}
