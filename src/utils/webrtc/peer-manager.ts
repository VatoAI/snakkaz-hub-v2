
import SimplePeer from 'simple-peer';
import { PeerConnection } from './types';
import { SignalingService } from './signaling';
import 'web-streams-polyfill';

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

  setupPeerEventHandlers(peer: SimplePeer.Instance, peerId: string) {
    peer.on('signal', async (data) => {
      await this.signalingService.sendSignal({
        sender_id: this.userId,
        receiver_id: peerId,
        signal_data: data
      });
    });

    peer.on('connect', () => {
      console.log('Connected to peer:', peerId);
    });

    peer.on('data', async (data) => {
      if (this.onMessageCallback) {
        try {
          const message = data.toString();
          this.onMessageCallback(message, peerId);
        } catch (error) {
          console.error('Error handling incoming message:', error);
        }
      }
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      this.connections.delete(peerId);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', peerId);
      this.connections.delete(peerId);
    });
  }

  async handleIncomingSignal(signal: any) {
    const { sender_id, signal_data } = signal;
    
    let connection = this.connections.get(sender_id);
    if (!connection) {
      console.log('Creating new peer connection for incoming signal');
      const peerOptions = {
        initiator: false,
        trickle: true,
        config: DEFAULT_CONFIG,
        streams: []  // Add empty streams array to prevent stream initialization
      };

      try {
        const peer = new SimplePeer(peerOptions);
        connection = {
          peer,
          connection: peer._pc,
          dataChannel: null
        };

        this.connections.set(sender_id, connection);
        this.setupPeerEventHandlers(peer, sender_id);
      } catch (error) {
        console.error('Error creating peer:', error);
        throw error;
      }
    }

    try {
      connection.peer.signal(signal_data);
    } catch (error) {
      console.error('Error handling signal:', error);
      this.connections.delete(sender_id);
      throw error;
    }
  }

  async createPeer(peerId: string) {
    console.log('Creating new peer connection');
    const peerOptions = {
      initiator: true,
      trickle: true,
      config: DEFAULT_CONFIG,
      streams: []  // Add empty streams array to prevent stream initialization
    };

    try {
      const peer = new SimplePeer(peerOptions);
      this.setupPeerEventHandlers(peer, peerId);

      const connection = {
        peer,
        connection: peer._pc,
        dataChannel: null
      };

      this.connections.set(peerId, connection);
      return peer;
    } catch (error) {
      console.error('Error creating peer:', error);
      throw error;
    }
  }

  getPeerConnection(peerId: string) {
    return this.connections.get(peerId);
  }

  disconnect(peerId: string) {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.peer.destroy();
      this.connections.delete(peerId);
    }
  }

  disconnectAll() {
    this.connections.forEach((_, peerId) => {
      this.disconnect(peerId);
    });
  }
}
