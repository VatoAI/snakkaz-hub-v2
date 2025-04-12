export interface BandwidthLimits {
  minBitrate: number; // kbps
  maxBitrate: number; // kbps
  startBitrate: number; // kbps
}

export class BandwidthManager {
  private static readonly DEFAULT_LIMITS: BandwidthLimits = {
    minBitrate: 100, // 100 kbps
    maxBitrate: 2000, // 2 Mbps
    startBitrate: 500 // 500 kbps
  };

  private currentLimits: Map<string, BandwidthLimits> = new Map();
  private qualityAdjustments: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultLimits();
  }

  private initializeDefaultLimits() {
    this.currentLimits.set('default', BandwidthManager.DEFAULT_LIMITS);
  }

  public setBandwidthLimits(peerId: string, limits: Partial<BandwidthLimits>) {
    const current = this.currentLimits.get(peerId) || BandwidthManager.DEFAULT_LIMITS;
    this.currentLimits.set(peerId, {
      ...current,
      ...limits
    });
  }

  public getBandwidthLimits(peerId: string): BandwidthLimits {
    return this.currentLimits.get(peerId) || BandwidthManager.DEFAULT_LIMITS;
  }

  public adjustBandwidthBasedOnQuality(peerId: string, quality: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
  }) {
    const limits = this.getBandwidthLimits(peerId);
    const adjustment = this.calculateQualityAdjustment(quality);
    this.qualityAdjustments.set(peerId, adjustment);

    const newLimits = {
      minBitrate: Math.max(limits.minBitrate * adjustment, 50),
      maxBitrate: Math.min(limits.maxBitrate * adjustment, 5000),
      startBitrate: Math.min(limits.startBitrate * adjustment, 2000)
    };

    this.setBandwidthLimits(peerId, newLimits);
    return newLimits;
  }

  private calculateQualityAdjustment(quality: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
  }): number {
    // Base adjustment on multiple factors
    const latencyFactor = this.calculateLatencyFactor(quality.latency);
    const packetLossFactor = this.calculatePacketLossFactor(quality.packetLoss);
    const bandwidthFactor = this.calculateBandwidthFactor(quality.bandwidth);

    // Combine factors with weights
    return (latencyFactor * 0.4 + packetLossFactor * 0.4 + bandwidthFactor * 0.2);
  }

  private calculateLatencyFactor(latency: number): number {
    if (latency < 100) return 1.0;
    if (latency < 200) return 0.8;
    if (latency < 300) return 0.6;
    if (latency < 500) return 0.4;
    return 0.2;
  }

  private calculatePacketLossFactor(packetLoss: number): number {
    if (packetLoss < 1) return 1.0;
    if (packetLoss < 3) return 0.8;
    if (packetLoss < 5) return 0.6;
    if (packetLoss < 10) return 0.4;
    return 0.2;
  }

  private calculateBandwidthFactor(bandwidth: number): number {
    if (bandwidth > 2000) return 1.0;
    if (bandwidth > 1000) return 0.8;
    if (bandwidth > 500) return 0.6;
    if (bandwidth > 200) return 0.4;
    return 0.2;
  }

  public applyBandwidthLimits(connection: RTCPeerConnection, peerId: string) {
    const limits = this.getBandwidthLimits(peerId);
    
    // Apply bandwidth constraints to the connection
    const sender = connection.getSenders()[0];
    if (sender) {
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      
      parameters.encodings[0].maxBitrate = limits.maxBitrate * 1000; // Convert to bps
      parameters.encodings[0].minBitrate = limits.minBitrate * 1000;
      parameters.encodings[0].maxFramerate = 30;
      
      sender.setParameters(parameters);
    }
  }

  public resetBandwidthLimits(peerId: string) {
    this.currentLimits.delete(peerId);
    this.qualityAdjustments.delete(peerId);
  }
} 