export interface ConnectionQuality {
  bandwidth: number; // kbps
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  connectionType: 'direct' | 'relay' | 'unknown';
}

export class ConnectionQualityMonitor {
  private static readonly MONITORING_INTERVAL = 5000; // 5 seconds
  private static readonly HISTORY_SIZE = 10;
  private qualityHistory: Map<string, ConnectionQuality[]> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.startGlobalMonitoring();
  }

  private startGlobalMonitoring() {
    setInterval(() => {
      this.cleanupStaleConnections();
    }, ConnectionQualityMonitor.MONITORING_INTERVAL * 2);
  }

  public startMonitoring(peerId: string, connection: RTCPeerConnection) {
    if (this.monitoringIntervals.has(peerId)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const quality = await this.measureQuality(connection);
        this.updateQualityHistory(peerId, quality);
      } catch (error) {
        console.error(`Error monitoring connection quality for ${peerId}:`, error);
      }
    }, ConnectionQualityMonitor.MONITORING_INTERVAL);

    this.monitoringIntervals.set(peerId, interval);
  }

  public stopMonitoring(peerId: string) {
    const interval = this.monitoringIntervals.get(peerId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(peerId);
      this.qualityHistory.delete(peerId);
    }
  }

  private async measureQuality(connection: RTCPeerConnection): Promise<ConnectionQuality> {
    const stats = await connection.getStats();
    let bandwidth = 0;
    let latency = 0;
    let packetLoss = 0;
    let jitter = 0;
    let connectionType: 'direct' | 'relay' | 'unknown' = 'unknown';

    for (const stat of stats.values()) {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        connectionType = stat.remoteCandidateId.includes('relay') ? 'relay' : 'direct';
        bandwidth = stat.availableOutgoingBitrate || 0;
        latency = stat.currentRoundTripTime || 0;
        packetLoss = stat.packetsLost || 0;
        jitter = stat.jitter || 0;
      }
    }

    return {
      bandwidth: bandwidth / 1000, // Convert to kbps
      latency: latency * 1000, // Convert to ms
      packetLoss: (packetLoss / (packetLoss + stats.get('packetsReceived') || 1)) * 100,
      jitter: jitter * 1000, // Convert to ms
      connectionType
    };
  }

  private updateQualityHistory(peerId: string, quality: ConnectionQuality) {
    const history = this.qualityHistory.get(peerId) || [];
    history.push(quality);
    
    if (history.length > ConnectionQualityMonitor.HISTORY_SIZE) {
      history.shift();
    }
    
    this.qualityHistory.set(peerId, history);
  }

  public getCurrentQuality(peerId: string): ConnectionQuality | null {
    const history = this.qualityHistory.get(peerId);
    return history ? history[history.length - 1] : null;
  }

  public getQualityHistory(peerId: string): ConnectionQuality[] {
    return this.qualityHistory.get(peerId) || [];
  }

  public getAverageQuality(peerId: string): ConnectionQuality | null {
    const history = this.qualityHistory.get(peerId);
    if (!history || history.length === 0) {
      return null;
    }

    return {
      bandwidth: history.reduce((sum, q) => sum + q.bandwidth, 0) / history.length,
      latency: history.reduce((sum, q) => sum + q.latency, 0) / history.length,
      packetLoss: history.reduce((sum, q) => sum + q.packetLoss, 0) / history.length,
      jitter: history.reduce((sum, q) => sum + q.jitter, 0) / history.length,
      connectionType: history[history.length - 1].connectionType
    };
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    for (const [peerId, interval] of this.monitoringIntervals.entries()) {
      const history = this.qualityHistory.get(peerId);
      if (!history || history.length === 0) {
        this.stopMonitoring(peerId);
      }
    }
  }
} 