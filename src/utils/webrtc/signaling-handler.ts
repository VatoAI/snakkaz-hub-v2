
import { PeerConnection, SignalPayload } from './types';
import { SignalingService } from './signaling';

export class SignalingHandler {
  constructor(
    private userId: string,
    private signalingService: SignalingService
  ) {}

  public async handleIncomingSignal(
    signal: SignalPayload,
    connections: Map<string, PeerConnection>,
    createPeerConnectionFn: (peerId: string) => PeerConnection,
    setupConnectionEventHandlersFn: (connection: PeerConnection) => void
  ): Promise<void> {
    const { sender_id: senderId, signal_data: data } = signal;
    
    if (!senderId || !data) {
      console.log('Invalid signal received, missing sender or data');
      return;
    }
    
    try {
      // Handle different signal types
      if (data.type === 'offer') {
        await this.handleOffer(senderId, data, connections, createPeerConnectionFn, setupConnectionEventHandlersFn);
      } else if (data.type === 'answer') {
        await this.handleAnswer(senderId, data, connections);
      } else if (data.type === 'ice-candidate') {
        await this.handleIceCandidate(senderId, data.candidate, connections);
      } else {
        console.log(`Unknown signal type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  private async handleOffer(
    senderId: string,
    offer: any,
    connections: Map<string, PeerConnection>,
    createPeerConnectionFn: (peerId: string) => PeerConnection,
    setupConnectionEventHandlersFn: (connection: PeerConnection) => void
  ): Promise<void> {
    console.log(`Received offer from ${senderId}`);
    
    let connection = connections.get(senderId);
    
    if (!connection) {
      connection = createPeerConnectionFn(senderId);
      connections.set(senderId, connection);
      setupConnectionEventHandlersFn(connection);
    }
    
    try {
      await connection.connection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await connection.connection.createAnswer();
      await connection.connection.setLocalDescription(answer);
      
      await this.signalingService.sendSignal({
        sender_id: this.userId,
        receiver_id: senderId,
        signal_data: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
      
      console.log(`Sent answer to ${senderId}`);
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  private async handleAnswer(
    senderId: string,
    answer: any,
    connections: Map<string, PeerConnection>
  ): Promise<void> {
    console.log(`Received answer from ${senderId}`);
    
    const connection = connections.get(senderId);
    if (!connection) {
      throw new Error(`No connection found for peer ${senderId}`);
    }
    
    try {
      await connection.connection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`Set remote description for ${senderId}`);
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  private async handleIceCandidate(
    senderId: string,
    candidate: RTCIceCandidateInit,
    connections: Map<string, PeerConnection>
  ): Promise<void> {
    console.log(`Received ICE candidate from ${senderId}`);
    
    const connection = connections.get(senderId);
    if (!connection) {
      console.log(`No connection found for peer ${senderId}, storing candidate for later`);
      return;
    }
    
    try {
      await connection.connection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`Added ICE candidate for ${senderId}`);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }
}
