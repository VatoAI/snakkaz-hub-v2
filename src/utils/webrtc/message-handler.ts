import { PeerManager } from './peer-manager';
import { MessageSender } from './message-sender';
import { MessageReceiver } from './message-receiver';
import { MessageRetryManager } from './message-retry';
// import { encryptMessage, decryptMessage } from '../encryption';

export class MessageHandler {
  private messageSender: MessageSender;
  private messageReceiver: MessageReceiver;
  private messageRetryManager: MessageRetryManager;
  private peerManager: PeerManager;
  // Store the callback for incoming raw (already decrypted or non-encrypted) messages
  private onMessageCallback: ((message: any, peerId: string) => void) | null = null;
  
  constructor(
    peerManager: PeerManager,
    // secureConnections: Map<string, CryptoKey> // Remove from constructor if not used
  ) {
    this.peerManager = peerManager;
    this.messageSender = new MessageSender();
    this.messageReceiver = new MessageReceiver();
    this.messageRetryManager = new MessageRetryManager(
      this.messageSender,
      this.peerManager.getConnection.bind(this.peerManager)
    );
    this.setupPeerManagerListeners();
  }

  private setupPeerManagerListeners(): void {
    // Listen for data channel messages from PeerManager
    this.peerManager.onDataChannelMessage = (message: string, peerId: string) => {
        console.log(`MessageHandler received raw message string from PeerManager for ${peerId}`);
        // Pass the raw string message directly to the callback set by WebRTCManager
        // WebRTCManager's callback is now responsible for parsing and decryption.
        if (this.onMessageCallback) {
            try {
                 // Forward the raw string data. WebRTCManager will handle parsing/decryption.
                 this.onMessageCallback(message, peerId);
            } catch (e) {
                 console.error(`Error in onMessageCallback for peer ${peerId}:`, e);
            }

        } else {
             console.warn(`No message callback set in MessageHandler for message from ${peerId}`);
        }
    };
  }

  // Callback setup by WebRTCManager to receive the raw message string
  public setupMessageCallback(callback: (message: any, peerId: string) => void): void {
    this.onMessageCallback = callback;
  }

  // Renamed to reflect sending *encrypted* data object (already encrypted by WebRTCManager)
  // The 'payload' here is the object like { iv: string, encryptedData: string }
  public async sendEncryptedMessage(peerId: string, encryptedPayload: any): Promise<boolean> {
    try {
      const peerConnection = this.peerManager.getPeerConnection(peerId);
      if (!peerConnection || !peerConnection.dataChannel || peerConnection.dataChannel.readyState !== 'open') {
        console.error(`Data channel not ready or available for peer ${peerId}`);
        return false;
      }

      // Stringify the encrypted payload object before sending
      const messageString = JSON.stringify(encryptedPayload);
      console.log(`MessageHandler sending stringified payload to ${peerId}:`, messageString);
      peerConnection.dataChannel.send(messageString);
      return true;
    } catch (error) {
      console.error(`Error sending message via data channel to ${peerId}:`, error);
      return false;
    }
  }

  public async sendDirectMessage(peerId: string, message: string): Promise<boolean> {
    const connection = this.peerManager.getConnection(peerId);
    
    if (!connection || !connection.dataChannel || connection.dataChannel.readyState !== 'open') {
      console.log(`Cannot send direct message to peer ${peerId}: no open data channel`);
      return false;
    }

    try {
      // Get current retry count
      const retryCount = this.messageSender.getRetryCount(peerId);
      
      // Check if we've exceeded max retries
      if (this.messageSender.hasExceededMaxRetries(peerId)) {
        this.messageSender.resetRetryCount(peerId); // Reset for future attempts
        throw new Error(`Max retry attempts reached for peer ${peerId}`);
      }
      
      // Check connection state before sending
      if (!connection || 
          !connection.dataChannel || 
          connection.dataChannel.readyState !== 'open' ||
          connection.connection.connectionState !== 'connected') {
        console.log(`Connection to peer ${peerId} is not ready for direct messaging`);
        
        // Increment retry count
        this.messageSender.incrementRetryCount(peerId);
        
        throw new Error(`Connection to peer ${peerId} is not ready for direct messaging`);
      }
      
      // Reset retry count on successful connection
      this.messageSender.resetRetryCount(peerId);
      
      return await this.sendEncryptedMessage(peerId, message);
    } catch (error) {
      console.error(`Failed to send direct message to ${peerId}:`, error);
      throw error;
    }
  }

  // Add method to retry failed message delivery
  public async retryMessage(peerId: string, message: string, isDirect: boolean = true): Promise<boolean> {
    return await this.messageRetryManager.retryMessage(peerId, message, isDirect);
  }
}
