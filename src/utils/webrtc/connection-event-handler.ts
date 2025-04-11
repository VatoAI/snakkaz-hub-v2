import { PeerConnection } from './types';
import { DataChannelHandler } from './data-channel-handler';
import { SignalingService } from './signaling';
import { ConnectionStateManager } from './connection-state-manager';

export class ConnectionEventHandler {
  constructor(
    private userId: string,
    private signalingService: SignalingService,
    private dataChannelHandler: DataChannelHandler,
    private connectionStateManager: ConnectionStateManager
  ) {}

  public setupConnectionEventHandlers(connection: PeerConnection, peerId: string): void {
    // Handler for ICE candidates
    connection.connection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidateJson = {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          usernameFragment: event.candidate.usernameFragment
        };

        try {
          await this.signalingService.sendSignal({
            sender_id: this.userId,
            receiver_id: peerId,
            signal_data: { candidate: candidateJson }
          });
        } catch (error) {
          console.error(`Error sending ICE candidate to peer ${peerId}:`, error);
        }
      }
    };
    
    // Handler for ICE connection state changes
    connection.connection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${peerId}: ${connection.connection.iceConnectionState}`);
      
      if (connection.connection.iceConnectionState === 'failed') {
        console.log(`ICE connection failed with peer ${peerId}, attempting to restart ICE`);
        connection.connection.restartIce();
      }
    };

    // Handler for datachannel creation by the peer
    connection.connection.ondatachannel = (event) => {
      this.dataChannelHandler.handleIncomingDataChannel(connection, event, peerId);
    };

    // Handler for connection state changes
    connection.connection.onconnectionstatechange = () => {
      const state = connection.connection.connectionState;
      console.log(`Connection state with ${peerId}:`, state);
      
      // Update connection state in ConnectionStateManager
      this.connectionStateManager.updateConnectionState(peerId, state as RTCPeerConnectionState);
      
      if (state === 'connected') {
        this.dataChannelHandler.setupDataChannel(connection, peerId);
      } else if (state === 'failed' || state === 'closed') {
        console.log(`Connection with ${peerId} is ${state}`);
      }
    };
    
    // Handler for signaling state changes
    connection.connection.onsignalingstatechange = () => {
      console.log(`Signaling state with ${peerId}:`, connection.connection.signalingState);
    };

    // Handler for data channel state changes
    if (connection.dataChannel) {
      connection.dataChannel.onopen = () => {
        this.connectionStateManager.updateDataChannelState(peerId, 'open');
      };
      
      connection.dataChannel.onclose = () => {
        this.connectionStateManager.updateDataChannelState(peerId, 'closed');
      };
      
      connection.dataChannel.onerror = () => {
        this.connectionStateManager.updateDataChannelState(peerId, 'closed');
      };
    }
  }
}
