
import { encryptMessage, decryptMessage } from '../encryption';
import { PeerManager } from './peer-manager';

export class MessageHandler {
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
          iv: iv
        });
      } else {
        // For regular messages, just wrap with type
        messageToSend = JSON.stringify({
          type: 'regular',
          content: message
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
      // Check connection state before sending
      const connection = this.peerManager.getPeerConnection(peerId);
      if (!connection || 
          !connection.dataChannel || 
          connection.dataChannel.readyState !== 'open' ||
          connection.connection.connectionState !== 'connected') {
        console.log(`Connection to peer ${peerId} is not ready for direct messaging`);
        throw new Error(`Connection to peer ${peerId} is not ready for direct messaging`);
      }
      
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
          callback(`[Privat] ${decryptedMessage}`, peerId);
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
}
