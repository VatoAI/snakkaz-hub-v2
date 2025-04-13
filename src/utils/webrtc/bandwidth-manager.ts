
export class BandwidthManager {
  private static readonly DEFAULT_MAX_BITRATE = 1000000; // 1 Mbps
  
  constructor(private connection: RTCPeerConnection) {}

  public async setBandwidthLimit(maxBitrate: number = BandwidthManager.DEFAULT_MAX_BITRATE) {
    try {
      const senders = this.connection.getSenders();
      
      for (const sender of senders) {
        if (sender.track && sender.track.kind === 'video') {
          await this.setVideoSenderBandwidth(sender, maxBitrate);
        }
      }
      
      console.log(`Bandwidth limit set to ${maxBitrate / 1000} kbps`);
    } catch (error) {
      console.error('Error setting bandwidth limit:', error);
    }
  }

  private async setVideoSenderBandwidth(sender: RTCRtpSender, maxBitrate: number) {
    try {
      const parameters = sender.getParameters();
      
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      
      // Set bandwidth limit for all encodings
      for (const encoding of parameters.encodings) {
        encoding.maxBitrate = maxBitrate;
      }
      
      await sender.setParameters(parameters);
    } catch (error) {
      console.error('Error setting sender bandwidth:', error);
    }
  }

  public async adaptToNetworkConditions() {
    try {
      // This is a simplified version that could be expanded with actual metrics
      const stats = await this.getConnectionStats();
      
      if (stats.packetLoss > 0.1) { // More than 10% packet loss
        await this.setBandwidthLimit(500000); // 500 kbps
      } else if (stats.roundTripTime > 300) { // RTT > 300ms
        await this.setBandwidthLimit(800000); // 800 kbps
      } else {
        await this.setBandwidthLimit(); // Default
      }
      
      console.log('Adapted bandwidth based on network conditions:', stats);
    } catch (error) {
      console.error('Error adapting to network conditions:', error);
    }
  }

  private async getConnectionStats(): Promise<{ packetLoss: number; roundTripTime: number }> {
    let packetLoss = 0;
    let roundTripTime = 0;
    let statsCount = 0;
    
    try {
      const stats = await this.connection.getStats();
      
      stats.forEach(report => {
        if (report.type === 'remote-inbound-rtp') {
          if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
            const totalPackets = report.packetsLost + report.packetsReceived;
            if (totalPackets > 0) {
              packetLoss += report.packetsLost / totalPackets;
              statsCount++;
            }
          }
          
          if (report.roundTripTime !== undefined) {
            roundTripTime += report.roundTripTime * 1000; // Convert to ms
            statsCount++;
          }
        }
      });
      
      if (statsCount > 0) {
        packetLoss /= statsCount;
        roundTripTime /= statsCount;
      }
      
      return { packetLoss, roundTripTime };
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return { packetLoss: 0, roundTripTime: 0 };
    }
  }
}
