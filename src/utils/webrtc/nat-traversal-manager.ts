import { PeerConnection } from './types';

export class NATTraversalManager {
  private static readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Add your TURN servers here
    // { urls: 'turn:your-turn-server.com', username: 'username', credential: 'credential' }
  ];

  private connectionAttempts: Map<string, number> = new Map();
  private static readonly MAX_DIRECT_ATTEMPTS = 3;
  private static readonly MAX_RELAY_ATTEMPTS = 2;

  public async setupConnection(peerId: string, connection: RTCPeerConnection): Promise<void> {
    try {
      // First attempt: Direct connection
      await this.attemptDirectConnection(peerId, connection);
    } catch (error) {
      console.log(`Direct connection failed for ${peerId}, attempting relay...`);
      await this.attemptRelayConnection(peerId, connection);
    }
  }

  private async attemptDirectConnection(peerId: string, connection: RTCPeerConnection): Promise<void> {
    const attempts = this.connectionAttempts.get(peerId) || 0;
    if (attempts >= NATTraversalManager.MAX_DIRECT_ATTEMPTS) {
      throw new Error('Max direct connection attempts reached');
    }

    // Configure ICE with STUN only
    const config = {
      iceServers: NATTraversalManager.ICE_SERVERS.filter(server => server.urls.startsWith('stun:'))
    };

    await this.setupICE(connection, config);
    this.connectionAttempts.set(peerId, attempts + 1);
  }

  private async attemptRelayConnection(peerId: string, connection: RTCPeerConnection): Promise<void> {
    const attempts = this.connectionAttempts.get(peerId) || 0;
    if (attempts >= NATTraversalManager.MAX_RELAY_ATTEMPTS) {
      throw new Error('Max relay connection attempts reached');
    }

    // Configure ICE with both STUN and TURN
    const config = {
      iceServers: NATTraversalManager.ICE_SERVERS
    };

    await this.setupICE(connection, config);
    this.connectionAttempts.set(peerId, attempts + 1);
  }

  private async setupICE(connection: RTCPeerConnection, config: RTCConfiguration): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ICE setup timeout'));
      }, 30000); // 30 seconds timeout

      connection.onicecandidate = (event) => {
        if (event.candidate === null) {
          clearTimeout(timeout);
          resolve();
        }
      };

      connection.oniceconnectionstatechange = () => {
        if (connection.iceConnectionState === 'failed') {
          clearTimeout(timeout);
          reject(new Error('ICE connection failed'));
        }
      };

      // Apply the configuration
      Object.assign(connection, { configuration: config });
    });
  }

  public resetAttempts(peerId: string) {
    this.connectionAttempts.delete(peerId);
  }

  public getConnectionType(connection: RTCPeerConnection): 'direct' | 'relay' | 'unknown' {
    const stats = connection.getStats();
    return stats.then(stats => {
      for (const stat of stats.values()) {
        if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          return stat.remoteCandidateId.includes('relay') ? 'relay' : 'direct';
        }
      }
      return 'unknown';
    });
  }
} 