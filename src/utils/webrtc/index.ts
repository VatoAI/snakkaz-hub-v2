
import { generateKeyPair, establishSecureConnection } from '../encryption';
import { PeerManager } from './peer-manager';

export class WebRTCManager {
  private peerManager: PeerManager;
  private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  private onMessageCallback: ((message: string, peerId: string) => void) | null = null;

  constructor(private userId: string) {
    this.peerManager = new PeerManager(userId);
    this.initializeKeyPair();
    this.setupSignalingListener();
  }

  private async initializeKeyPair() {
    try {
      this.localKeyPair = await generateKeyPair();
      console.log('Local key pair generated');
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    }
  }

  private setupSignalingListener() {
    return this.peerManager.signalingService.setupSignalingListener(
      async (signal) => await this.peerManager.handleIncomingSignal(signal)
    );
  }

  public async connectToPeer(peerId: string, peerPublicKey: JsonWebKey) {
    if (!this.localKeyPair) {
      throw new Error('Local key pair not initialized');
    }

    try {
      const peer = await this.peerManager.createPeer(peerId);

      await establishSecureConnection(
        this.localKeyPair.publicKey,
        this.localKeyPair.privateKey,
        peerPublicKey
      );

      return peer;
    } catch (error) {
      console.error('Error connecting to peer:', error);
      throw error;
    }
  }

  public async sendMessage(peerId: string, message: string) {
    const connection = this.peerManager.getPeerConnection(peerId);
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
    this.peerManager = new PeerManager(this.userId, callback);
  }

  public getPublicKey(): JsonWebKey | null {
    return this.localKeyPair?.publicKey || null;
  }

  public disconnect(peerId: string) {
    this.peerManager.disconnect(peerId);
  }

  public disconnectAll() {
    this.peerManager.disconnectAll();
  }
}

export const createWebRTCManager = (userId: string) => new WebRTCManager(userId);
