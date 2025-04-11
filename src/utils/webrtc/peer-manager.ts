import { PeerConnection } from './types';
import { SignalingService } from './signaling';
import { RTCConfig } from './config';
import { DataChannelHandler } from './data-channel-handler';
import { ConnectionEventHandler } from './connection-event-handler';
import { SignalingHandler } from './signaling-handler';
import { ConnectionStateManager } from './connection-state-manager';
import { ConnectionManager } from './connection-manager';

export class PeerManager {
  private connections: Map<string, PeerConnection> = new Map();
  public signalingService: SignalingService;
  private dataChannelHandler: DataChannelHandler;
  private connectionEventHandler: ConnectionEventHandler;
  private signalingHandler: SignalingHandler;
  private messageCallback: ((message: string, peerId: string) => void) | null = null;
  private connectionStateManager: ConnectionStateManager;
  private connectionManager: ConnectionManager;

  constructor(
    private userId: string,
    onMessageCallback: ((message: string, peerId: string) => void) | null = null
  ) {
    this.messageCallback = onMessageCallback;
    this.signalingService = new SignalingService(userId);
    this.dataChannelHandler = new DataChannelHandler(this.messageCallback);
    
    // Create connection manager first
    this.connectionManager = new ConnectionManager(this, new Map(), null);
    
    // Then create state manager with connection manager
    this.connectionStateManager = new ConnectionStateManager(this.connectionManager);
    
    // Finally create event handler with state manager
    this.connectionEventHandler = new ConnectionEventHandler(
      userId, 
      this.signalingService, 
      this.dataChannelHandler,
      this.connectionStateManager
    );
    
    this.signalingHandler = new SignalingHandler(userId, this.signalingService);
  }

  public setMessageCallback(callback: (message: string, peerId: string) => void) {
    this.messageCallback = callback;
    this.dataChannelHandler.setMessageCallback(callback);
  }

  private createPeerConnection(peerId: string): PeerConnection {
    const peerConnection = new RTCPeerConnection(RTCConfig);
    
    return {
      peer: null,
      connection: peerConnection,
      dataChannel: null
    };
  }

  public async handleIncomingSignal(signal: any): Promise<void> {
    await this.signalingHandler.handleIncomingSignal(
      signal, 
      this.connections, 
      this.createPeerConnection.bind(this), 
      this.connectionEventHandler.setupConnectionEventHandlers.bind(this.connectionEventHandler)
    );
  }

  public async createPeer(peerId: string): Promise<PeerConnection> {
    console.log('Creating new peer connection to:', peerId);
    const peerConnection = new RTCPeerConnection(RTCConfig);

    const connection: PeerConnection = {
      peer: null,
      connection: peerConnection,
      dataChannel: null
    };

    this.connectionEventHandler.setupConnectionEventHandlers(connection, peerId);
    
    try {
      // Store the connection first in case we need to access it during signaling
      this.connections.set(peerId, connection);
      
      // Check if the signaling state is stable before creating an offer
      if (peerConnection.signalingState === 'stable') {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
          iceRestart: true // Enable ICE restart for better connection recovery
        });
        await peerConnection.setLocalDescription(offer);
        
        await this.signalingService.sendSignal({
          sender_id: this.userId,
          receiver_id: peerId,
          signal_data: {
            type: offer.type,
            sdp: offer.sdp
          }
        });
      } else {
        console.log(`Cannot create offer in current signaling state: ${peerConnection.signalingState}`);
      }

      return connection;
    } catch (error) {
      console.error('Error creating peer:', error);
      this.connections.delete(peerId);
      throw error;
    }
  }

  getPeerConnection(peerId: string): PeerConnection | undefined {
    return this.connections.get(peerId);
  }

  isConnected(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    return !!connection && 
           !!connection.dataChannel && 
           connection.dataChannel.readyState === 'open' &&
           connection.connection.connectionState === 'connected';
  }

  disconnect(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      if (connection.dataChannel) {
        try {
          connection.dataChannel.close();
        } catch (e) {
          console.error(`Error closing data channel for peer ${peerId}:`, e);
        }
      }
      
      try {
        connection.connection.close();
      } catch (e) {
        console.error(`Error closing connection for peer ${peerId}:`, e);
      }
      
      this.connections.delete(peerId);
    }
  }

  disconnectAll(): void {
    this.connections.forEach((connection, peerId) => {
      this.disconnect(peerId);
    });
  }

  public async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    const connection = this.getOrCreatePeerConnection(peerId);
    try {
      await connection.connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await connection.connection.createAnswer();
      await connection.connection.setLocalDescription(answer);
      await this.signalingService.sendSignal(peerId, {
        type: 'answer',
        sender: this.userId,
        data: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  public async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`No connection found for peer ${peerId}`);
    }

    try {
      await connection.connection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  public async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error(`No connection found for peer ${peerId}`);
    }

    try {
      await connection.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  public async establishSecureConnection(
    peerId: string,
    remotePublicKey: CryptoKey,
    localKeyPair: CryptoKeyPair
  ): Promise<CryptoKey | null> {
    try {
      // Derive shared secret using ECDH
      const sharedSecret = await crypto.subtle.deriveBits(
        {
          name: 'ECDH',
          public: remotePublicKey
        },
        localKeyPair.privateKey,
        256
      );

      // Convert shared secret to AES key
      const sharedKey = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      return sharedKey;
    } catch (error) {
      console.error('Error establishing secure connection:', error);
      return null;
    }
  }

  public getConnectedPeerIds(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, connection]) => 
        connection.connection.connectionState === 'connected' &&
        connection.dataChannel?.readyState === 'open'
      )
      .map(([peerId]) => peerId);
  }

  private getOrCreatePeerConnection(peerId: string): PeerConnection {
    let connection = this.connections.get(peerId);
    if (!connection) {
      connection = this.createPeerConnection(peerId);
      this.connections.set(peerId, connection);
    }
    return connection;
  }

  private createPeerConnection(peerId: string): PeerConnection {
    const connection = new RTCPeerConnection(RTCConfig);
    
    connection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.signalingService.sendSignal(peerId, {
          type: 'ice-candidate',
          sender: this.userId,
          data: event.candidate
        });
      }
    };

    connection.onconnectionstatechange = () => {
      console.log(`Connection state changed for peer ${peerId}:`, connection.connectionState);
      this.connectionStateManager.updateConnectionState(peerId, connection.connectionState);
    };

    connection.ondatachannel = (event) => {
      this.dataChannelHandler.handleIncomingDataChannel({ connection, dataChannel: null }, event, peerId);
    };

    return { connection, dataChannel: null };
  }

  public disconnectAll() {
    for (const [peerId, connection] of this.connections) {
      if (connection.dataChannel) {
        connection.dataChannel.close();
      }
      connection.connection.close();
      this.connections.delete(peerId);
    }
  }
}
