export class NATTraversalManager {
  private stunServers: string[];
  private connectionAttempts: Map<string, number> = new Map();
  private static readonly MAX_RELAY_ATTEMPTS = 3;
  private static readonly ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  constructor(stunServers: string[] = ['stun:stun.l.google.com:19302']) {
    this.stunServers = stunServers;
  }

  public async detectConnectionType(peerId: string): Promise<"direct" | "relay" | "unknown"> {
    try {
      // Attempt to create a peer connection with STUN servers
      const pc = new RTCPeerConnection({ iceServers: this.getStunServers() });

      // Create a dummy data channel (optional, but helps trigger ICE candidate gathering)
      pc.createDataChannel('dummy');

      // Return a promise that resolves with the connection type
      return new Promise<"direct" | "relay" | "unknown">((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidateStr = event.candidate.candidate;

            if (candidateStr.includes('typ relay')) {
              resolve("relay");
            } else if (candidateStr.includes('typ host')) {
              resolve("direct");
            } else {
              resolve("unknown");
            }

            // Close the peer connection after detecting the type
            pc.close();
          } else {
            // No more candidates, and none matched, so resolve with unknown
            resolve("unknown");
            pc.close();
          }
        };

        // If no ICE candidates are gathered after a timeout, assume unknown
        setTimeout(() => {
          resolve("unknown");
          pc.close();
        }, 5000);
      });
    } catch (error) {
      console.error('Error detecting connection type:', error);
      return "unknown";
    }
  }

  private getStunServers(): RTCIceServer[] {
    return this.stunServers.map(url => ({ urls: url }));
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

  public resetAttempts(peerId: string): void {
    this.connectionAttempts.delete(peerId);
  }

  public async getConnectionType(connection: RTCPeerConnection): Promise<'direct' | 'relay' | 'unknown'> {
    try {
      const stats = await connection.getStats();
      for (const stat of stats.values()) {
        if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          return stat.remoteCandidateId.includes('relay') ? 'relay' : 'direct';
        }
      }
      return 'unknown';
    } catch (error) {
      console.error('Error getting connection type:', error);
      return 'unknown';
    }
  }
}
