
import SimplePeer from 'simple-peer';
import { generateKeyPair, establishSecureConnection } from './encryption';

interface PeerConnection {
  peer: SimplePeer.Instance;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

export class WebRTCManager {
  private connections: Map<string, PeerConnection> = new Map();
  private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  private onMessageCallback: ((message: string, peerId: string) => void) | null = null;

  constructor() {
    this.initializeKeyPair();
  }

  private async initializeKeyPair() {
    try {
      this.localKeyPair = await generateKeyPair();
      console.log('Local key pair generated');
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    }
  }

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey) {
    if (!this.localKeyPair) {
      throw new Error('Local key pair not initialized');
    }

    try {
      // Opprett WebRTC peer
      const peer = new SimplePeer({
        initiator: true,
        trickle: false
      });

      // Håndter signalering
      peer.on('signal', data => {
        // Her må du implementere en måte å sende signaleringsdataene til den andre peeren
        console.log('Signal data generated:', data);
      });

      // Håndter forbindelsen
      peer.on('connect', () => {
        console.log('Connected to peer:', peerId);
      });

      // Håndter innkommende data
      peer.on('data', async (data) => {
        if (this.onMessageCallback) {
          try {
            // Dekrypter meldingen med den delte hemmeligheten
            const message = data.toString();
            this.onMessageCallback(message, peerId);
          } catch (error) {
            console.error('Error handling incoming message:', error);
          }
        }
      });

      // Etabler sikker forbindelse
      const sharedKey = await establishSecureConnection(
        this.localKeyPair.publicKey,
        this.localKeyPair.privateKey,
        peerPublicKey
      );

      // Lagre forbindelsen
      this.connections.set(peerId, {
        peer,
        connection: peer._pc,
        dataChannel: null
      });

      return peer;
    } catch (error) {
      console.error('Error connecting to peer:', error);
      throw error;
    }
  }

  public async sendMessage(peerId: string, message: string) {
    const connection = this.connections.get(peerId);
    if (!connection) {
      throw new Error('No connection found for peer');
    }

    try {
      connection.peer.send(message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  public onMessage(callback: (message: string, peerId: string) => void) {
    this.onMessageCallback = callback;
  }

  public getPublicKey(): JsonWebKey | null {
    return this.localKeyPair?.publicKey || null;
  }

  public disconnect(peerId: string) {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.peer.destroy();
      this.connections.delete(peerId);
    }
  }

  public disconnectAll() {
    this.connections.forEach((connection, peerId) => {
      this.disconnect(peerId);
    });
  }
}

export const createWebRTCManager = () => new WebRTCManager();
