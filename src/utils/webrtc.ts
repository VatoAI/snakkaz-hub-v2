
import SimplePeer from 'simple-peer';
import { generateKeyPair, establishSecureConnection } from './encryption';
import { supabase } from '@/integrations/supabase/client';

interface PeerConnection {
  peer: SimplePeer.Instance;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

export class WebRTCManager {
  private connections: Map<string, PeerConnection> = new Map();
  private localKeyPair: { publicKey: JsonWebKey; privateKey: JsonWebKey } | null = null;
  private onMessageCallback: ((message: string, peerId: string) => void) | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
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
    const channel = supabase
      .channel('signaling')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signaling',
          filter: `receiver_id=eq.${this.userId}`
        },
        async (payload) => {
          console.log('Received signal:', payload);
          await this.handleIncomingSignal(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async handleIncomingSignal(signal: any) {
    const { sender_id, signal_data } = signal;
    
    let connection = this.connections.get(sender_id);
    if (!connection) {
      // Opprett ny peer-forbindelse hvis vi ikke har en fra før
      const peer = new SimplePeer({
        initiator: false,
        trickle: false
      });

      connection = {
        peer,
        connection: peer._pc,
        dataChannel: null
      };

      this.connections.set(sender_id, connection);

      // Sett opp hendelseshåndterere for den nye forbindelsen
      this.setupPeerEventHandlers(peer, sender_id);
    }

    // Signal til peer
    connection.peer.signal(signal_data);
  }

  private setupPeerEventHandlers(peer: SimplePeer.Instance, peerId: string) {
    peer.on('signal', async (data) => {
      // Send signaldata til den andre peeren via Supabase
      await supabase
        .from('signaling')
        .insert([{
          sender_id: this.userId,
          receiver_id: peerId,
          signal_data: data
        }] as any);  // Using type assertion since the table is not yet in the types
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

      // Sett opp hendelseshåndterere
      this.setupPeerEventHandlers(peer, peerId);

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

export const createWebRTCManager = (userId: string) => new WebRTCManager(userId);
