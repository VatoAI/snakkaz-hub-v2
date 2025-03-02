
import { encryptMessage, decryptMessage } from '../encryption';
import { PeerManager } from './peer-manager';

export class MessageHandler {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;
  
  constructor(
    private peerManager: PeerManager,
    private secureConnections: Map<string, CryptoKey>
  ) {}

  public async sendMessage(peerId: string, message: string, isDirect: boolean = false) {
    const connection = this.peerManager.getPeerConnection(peerId);
    if (!connection || !connection.dataChannel) {
      throw new Error(`No data channel found for peer ${peerId}`);
    }

    if (connection.dataChannel.readyState !== 'open') {
      throw new Error(`Data channel for peer ${peerId} is not open. Current state: ${connection.dataChannel.readyState}`);
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
      console.error('Error sending message:', error);
      throw error;
    }
  }

  public async sendDirectMessage(peerId: string, message: string) {
    try {
      // Get current retry count
      const retryCount = this.retryAttempts.get(peerId) || 0;
      
      // Check if we've exceeded max retries
      if (retryCount >= this.maxRetries) {
        this.retryAttempts.delete(peerId); // Reset for future attempts
        throw new Error(`Max retry attempts (${this.maxRetries}) reached for peer ${peerId}`);
      }
      
      // Check connection state before sending
      const connection = this.peerManager.getPeerConnection(peerId);
      if (!connection || 
          !connection.dataChannel || 
          connection.dataChannel.readyState !== 'open' ||
          connection.connection.connectionState !== 'connected') {
        console.log(`Connection to peer ${peerId} is not ready for direct messaging`);
        
        // Increment retry count
        this.retryAttempts.set(peerId, retryCount + 1);
        
        throw new Error(`Connection to peer ${peerId} is not ready for direct messaging`);
      }
      
      // Reset retry count on successful connection
      this.retryAttempts.delete(peerId);
      
      return await this.sendMessage(peerId, message, true);
    } catch (error) {
      console.error(`Failed to send direct message to ${peerId}:`, error);
      throw error;
    }
  }

  public setupMessageCallback(callback: (message: string, peerId: string) => void) {
    return async (messageData: string, peerId: string) => {
      try {
        console.log(`Received message from ${peerId}:`, messageData.substring(0, 30) + '...');
        
        // Parse the incoming message
        const parsedMessage = JSON.parse(messageData);
        
        if (parsedMessage.type === 'direct') {
          // Handle direct encrypted message
          console.log('Processing encrypted direct message');
          const decryptedMessage = await decryptMessage(
            parsedMessage.content,
            parsedMessage.key,
            parsedMessage.iv
          );
          callback(`${decryptedMessage}`, peerId);
        } else {
          // Handle regular message
          callback(parsedMessage.content, peerId);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        callback(messageData, peerId); // Fallback to raw message
      }
    };
  }
  
  // Add method to retry failed message delivery
  public async retryMessage(peerId: string, message: string, isDirect: boolean = true): Promise<boolean> {
    const retryCount = this.retryAttempts.get(peerId) || 0;
    
    if (retryCount >= this.maxRetries) {
      console.log(`Max retry attempts (${this.maxRetries}) reached for peer ${peerId}`);
      return false;
    }
    
    try {
      console.log(`Retrying message to peer ${peerId} (attempt ${retryCount + 1}/${this.maxRetries})`);
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      
      // Try sending again
      await this.sendMessage(peerId, message, isDirect);
      
      // Reset retry count on success
      this.retryAttempts.delete(peerId);
      
      return true;
    } catch (error) {
      console.error(`Retry attempt ${retryCount + 1} failed:`, error);
      
      // Increment retry count
      this.retryAttempts.set(peerId, retryCount + 1);
      
      return false;
    }
  }
}
