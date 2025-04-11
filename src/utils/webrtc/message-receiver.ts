import { decryptMessage } from '../encryption';

export class MessageReceiver {
  private messageCallback: ((message: string, peerId: string) => void) | null = null;

  constructor() {}

  public setupMessageCallback(callback: (message: string, peerId: string) => void) {
    this.messageCallback = callback;
    
    return async (messageData: string, peerId: string) => {
      if (!this.messageCallback) return;
      
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
          this.messageCallback(decryptedMessage, peerId);
        } else {
          // Handle regular message
          this.messageCallback(parsedMessage.content, peerId);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        this.messageCallback(messageData, peerId); // Fallback to raw message
      }
    };
  }
}
