
import { PeerConnection } from './types';
import { SignalingService } from './signaling';

const DEFAULT_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

export class PeerManager {
  private connections: Map<string, PeerConnection> = new Map();
  public signalingService: SignalingService;

  constructor(
    private userId: string,
    private onMessageCallback: ((message: string, peerId: string) => void) | null = null
  ) {
    this.signalingService = new SignalingService(userId);
  }

  private async setupDataChannel(connection: PeerConnection, peerId: string) {
    if (connection.connection.connectionState === 'connected') {
      const dataChannel = connection.connection.createDataChannel('messageChannel');
      connection.dataChannel = dataChannel;

      dataChannel.onmessage = (event) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(event.data, peerId);
        }
      };

      dataChannel.onopen = () => {
        console.log('Data channel opened with peer:', peerId);
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed with peer:', peerId);
      };
    }
  }

  private setupConnectionEventHandlers(connection: PeerConnection, peerId: string) {
    connection.connection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidateJson = {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          usernameFragment: event.candidate.usernameFragment
        };

        await this.signalingService.sendSignal({
          sender_id: this.userId,
          receiver_id: peerId,
          signal_data: { candidate: candidateJson }
        });
      }
    };

    connection.connection.ondatachannel = (event) => {
      connection.dataChannel = event.channel;
      
      event.channel.onmessage = (e) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(e.data, peerId);
        }
      };

      event.channel.onopen = () => {
        console.log('Data channel received from peer:', peerId);
      };

      event.channel.onclose = () => {
        console.log('Data channel from peer closed:', peerId);
      };
    };

    connection.connection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, connection.connection.connectionState);
      if (connection.connection.connectionState === 'connected') {
        this.setupDataChannel(connection, peerId);
      } else if (connection.connection.connectionState === 'failed' || 
                connection.connection.connectionState === 'closed') {
        console.log(`Connection with ${peerId} is ${connection.connection.connectionState}`);
        this.connections.delete(peerId);
      }
    };
  }

  async handleIncomingSignal(signal: any) {
    const { sender_id, signal_data } = signal;
    
    let connection = this.connections.get(sender_id);
    if (!connection) {
      console.log('Creating new peer connection for incoming signal from:', sender_id);
      const peerConnection = new RTCPeerConnection(DEFAULT_CONFIG);
      
      connection = {
        peer: null,
        connection: peerConnection,
        dataChannel: null
      };

      this.connections.set(sender_id, connection);
      this.setupConnectionEventHandlers(connection, sender_id);
    }

    try {
      if (signal_data.candidate) {
        const iceCandidate = new RTCIceCandidate(signal_data.candidate);
        await connection.connection.addIceCandidate(iceCandidate);
      } else if (signal_data.sdp) {
        const sessionDescription = new RTCSessionDescription({
          type: signal_data.type,
          sdp: signal_data.sdp
        });

        if (connection.connection.signalingState === 'stable' && signal_data.type === 'offer') {
          await connection.connection.setRemoteDescription(sessionDescription);
          const answer = await connection.connection.createAnswer();
          await connection.connection.setLocalDescription(answer);
          
          await this.signalingService.sendSignal({
            sender_id: this.userId,
            receiver_id: sender_id,
            signal_data: {
              type: answer.type,
              sdp: answer.sdp
            }
          });
        } else if (signal_data.type === 'answer') {
          await connection.connection.setRemoteDescription(sessionDescription);
        }
      }
    } catch (error) {
      console.error('Error handling signal:', error);
      this.connections.delete(sender_id);
      throw error;
    }
  }

  async createPeer(peerId: string) {
    console.log('Creating new peer connection to:', peerId);
    const peerConnection = new RTCPeerConnection(DEFAULT_CONFIG);

    const connection: PeerConnection = {
      peer: null,
      connection: peerConnection,
      dataChannel: null
    };

    this.setupConnectionEventHandlers(connection, peerId);
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      await this.signalingService.sendSignal({
        sender_id: this.userId,
        receiver_id: peerId,
        signal_data: {
          type: offer.type,
          sdp: offer.sdp
        }
      });

      this.connections.set(peerId, connection);
      return connection;
    } catch (error) {
      console.error('Error creating peer:', error);
      throw error;
    }
  }

  getPeerConnection(peerId: string) {
    return this.connections.get(peerId);
  }

  isConnected(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    return !!connection && 
           !!connection.dataChannel && 
           connection.dataChannel.readyState === 'open';
  }

  disconnect(peerId: string) {
    const connection = this.connections.get(peerId);
    if (connection) {
      if (connection.dataChannel) {
        connection.dataChannel.close();
      }
      connection.connection.close();
      this.connections.delete(peerId);
    }
  }

  disconnectAll() {
    this.connections.forEach((connection, peerId) => {
      this.disconnect(peerId);
    });
  }
}
