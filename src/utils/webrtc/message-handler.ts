import { PeerManager } from './peer-manager';
import { MessageSender } from './message-sender';
import { MessageReceiver } from './message-receiver';
import { MessageRetryManager } from './message-retry';

export class MessageHandler {
  private messageSender: MessageSender;
  private messageReceiver: MessageReceiver;
  private messageRetryManager: MessageRetryManager;
  
  constructor(
    private peerManager: PeerManager,
    private secureConnections: Map<string, CryptoKey>
  ) {
    this.messageSender = new MessageSender(secureConnections);
    this.messageReceiver = new MessageReceiver();
    this.messageRetryManager = new MessageRetryManager(
      this.messageSender,
      this.peerManager.getConnection.bind(this.peerManager)
    );
  }

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false): Promise<boolean> {
    const connection = this.peerManager.getConnection(peerId);
    
    if (!connection || !connection.dataChannel || connection.dataChannel.readyState !== 'open') {
      console.log(`Cannot send message to peer ${peerId}: no open data channel`);
      return false;
    }

    try {
      let messageToSend = message;
      
      if (isDirect) {
        // Use E2EE for direct messages
        const secureConnection = this.secureConnections.get(peerId);
        if (!secureConnection) {
          throw new Error(`No secure connection established with peer ${peerId}`);
        }
        
        const { encryptedContent, key, iv } = await encryptMessage(message);
        messageToSend = JSON.stringify({
          type: 'direct',
          content: encryptedContent,
          key: key,
          iv: iv,
          timestamp: new Date().toISOString(),
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      } else {
        // For regular messages, just wrap with type
        messageToSend = JSON.stringify({
          type: 'regular',
          content: message,
          timestamp: new Date().toISOString(),
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      }
      
      console.log(`Sending ${isDirect ? 'direct' : 'regular'} message to ${peerId}`);
      connection.dataChannel.send(messageToSend);
      return true;
    } catch (error) {
      console.error(`Error sending message to peer ${peerId}:`, error);
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
      
      return await this.sendMessage(peerId, message, true);
    } catch (error) {
      console.error(`Failed to send direct message to ${peerId}:`, error);
      throw error;
    }
  }

  public setupMessageCallback(callback: (message: string, peerId: string) => void) {
    return this.messageReceiver.setupMessageCallback(callback);
  }
  
  // Add method to retry failed message delivery
  public async retryMessage(peerId: string, message: string, isDirect: boolean = true): Promise<boolean> {
    return await this.messageRetryManager.retryMessage(peerId, message, isDirect);
  }
}
