
import { PeerConnection, SignalPayload, SimplePeerConnection } from './types';
import { SignalingService } from './signaling';
import { RTCConfig } from './rtc-config';
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
  private static instance: PeerManager;
  private userId: string;

  constructor(userId: string, messageCallback: ((message: string, peerId: string) => void) | null = null) {
    this.userId = userId;
    this.signalingService = new SignalingService(userId);
    this.dataChannelHandler = new DataChannelHandler(messageCallback);
    
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

  public static getInstance(userId: string): PeerManager {
    if (!PeerManager.instance) {
      PeerManager.instance = new PeerManager(userId);
    }
    return PeerManager.instance;
  }

  public setMessageCallback(callback: (message: string, peerId: string) => void) {
    this.messageCallback = callback;
    this.dataChannelHandler.setMessageCallback(callback);
  }

  private createPeerConnection(peerId: string): PeerConnection {
    const peerConnection = new RTCPeerConnection(RTCConfig);
    
    // Create a PeerConnection object that implements the PeerConnection interface
    const connection: PeerConnection = {
      connection: peerConnection,
      dataChannel: null,
      peerId,
      close: () => {
        if (connection.dataChannel) {
          connection.dataChannel.close();
        }
        connection.connection.close();
      },
      setDataChannel: (channel) => {
        connection.dataChannel = channel;
      }
    };
    
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.signalingService.sendSignal({
          sender_id: this.userId,
          receiver_id: peerId,
          signal_data: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state changed for peer ${peerId}:`, peerConnection.connectionState);
      this.connectionStateManager.updateConnectionState(peerId, peerConnection.connectionState);
    };

    peerConnection.ondatachannel = (event) => {
      this.dataChannelHandler.handleIncomingDataChannel(connection, event, peerId);
    };

    return connection;
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
    const connection = this.createPeerConnection(peerId);

    try {
      // Store the connection first in case we need to access it during signaling
      this.connections.set(peerId, connection);
      
      // Check if the signaling state is stable before creating an offer
      if (connection.connection.signalingState === 'stable') {
        const offer = await connection.connection.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
          iceRestart: true // Enable ICE restart for better connection recovery
        });
        await connection.connection.setLocalDescription(offer);
        
        await this.signalingService.sendSignal({
          sender_id: this.userId,
          receiver_id: peerId,
          signal_data: {
            type: offer.type,
            sdp: offer.sdp
          }
        });
      } else {
        console.log(`Cannot create offer in current signaling state: ${connection.connection.signalingState}`);
      }

      return connection;
    } catch (error) {
      console.error('Error creating peer:', error);
      this.connections.delete(peerId);
      throw error;
    }
  }

  public getConnection(peerId: string): PeerConnection | undefined {
    return this.connections.get(peerId);
  }

  public createConnection(peerId: string): PeerConnection {
    if (this.connections.has(peerId)) {
      return this.connections.get(peerId)!;
    }

    const connection = this.createPeerConnection(peerId);
    this.connections.set(peerId, connection);
    return connection;
  }

  public removeConnection(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.close();
      this.connections.delete(peerId);
    }
  }

  public disconnectAll(): void {
    for (const [peerId, connection] of this.connections) {
      connection.close();
      this.connections.delete(peerId);
    }
  }

  public getConnections(): Map<string, PeerConnection> {
    return this.connections;
  }

  public isConnected(peerId: string): boolean {
    const connection = this.connections.get(peerId);
    return !!connection && connection.connection.connectionState === 'connected';
  }

  public disconnect(peerId: string): void {
    this.removeConnection(peerId);
  }

  public async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    const connection = this.getOrCreatePeerConnection(peerId);
    try {
      await connection.connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await connection.connection.createAnswer();
      await connection.connection.setLocalDescription(answer);
      await this.signalingService.sendSignal({
        sender_id: this.userId,
        receiver_id: peerId,
        signal_data: {
          type: 'answer',
          sdp: answer.sdp
        }
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
}
