import { PeerConnection } from './types';

export class DataChannelHandler {
  private messageCallback: ((message: string, peerId: string) => void) | null = null;

  constructor(onMessageCallback: ((message: string, peerId: string) => void) | null = null) {
    this.messageCallback = onMessageCallback;
  }
  
  public setMessageCallback(callback: (message: string, peerId: string) => void) {
    this.messageCallback = callback;
  }
  
  public setupDataChannel(connection: PeerConnection, peerId: string): void {
    if (connection.connection.connectionState === 'connected') {
      try {
        // Check if a data channel already exists
        if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
          console.log(`Data channel already exists for peer ${peerId}`);
          return;
        }
        
        const dataChannel = connection.connection.createDataChannel('messageChannel', {
          ordered: true, // Ensure ordered delivery for chat messages
          maxRetransmits: 3 // Allow retransmissions for reliability
        });
        connection.dataChannel = dataChannel;

        this.setupDataChannelEvents(dataChannel, peerId);
      } catch (error) {
        console.error(`Error setting up data channel for peer ${peerId}:`, error);
      }
    }
  }
  
  public handleIncomingDataChannel(connection: PeerConnection, event: RTCDataChannelEvent, peerId: string): void {
    connection.dataChannel = event.channel;
    this.setupDataChannelEvents(event.channel, peerId);
  }
  
  private setupDataChannelEvents(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onmessage = (event) => {
      if (this.messageCallback) {
        this.messageCallback(event.data, peerId);
      }
    };

    dataChannel.onopen = () => {
      console.log('Data channel opened with peer:', peerId);
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed with peer:', peerId);
    };
    
    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error);
    };
  }
}
