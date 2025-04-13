
export class NATTraversalManager {
  private stunServers: string[];

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
}
