
/**
 * Secure Connection Monitor
 * 
 * Monitors WebRTC connections for security issues and potential attacks
 */

export interface ConnectionMetrics {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  connectionTime: number;
  reconnectAttempts: number;
  securityLevel: 'high' | 'medium' | 'low';
}

export class SecureConnectionMonitor {
  private connections: Map<string, ConnectionMetrics> = new Map();
  private anomalyThresholds = {
    maxLatency: 500, // ms
    maxPacketLoss: 15, // percentage
    minBandwidth: 50, // kbps
    maxReconnectAttempts: 5,
    suspiciousConnectionTimeThreshold: 100 // ms, unusually fast connections could be suspicious
  };
  
  /**
   * Update connection metrics for a peer
   */
  public updateMetrics(peerId: string, metrics: Partial<ConnectionMetrics>): void {
    const currentMetrics = this.connections.get(peerId) || {
      latency: 0,
      packetLoss: 0,
      bandwidth: 0,
      connectionTime: 0,
      reconnectAttempts: 0,
      securityLevel: 'medium'
    };
    
    this.connections.set(peerId, {
      ...currentMetrics,
      ...metrics
    });
    
    // Check for anomalies whenever metrics are updated
    this.checkForAnomalies(peerId);
  }
  
  /**
   * Check for security anomalies in the connection
   */
  private checkForAnomalies(peerId: string): void {
    const metrics = this.connections.get(peerId);
    if (!metrics) return;
    
    const anomalies = [];
    
    if (metrics.latency > this.anomalyThresholds.maxLatency) {
      anomalies.push(`High latency: ${metrics.latency}ms`);
    }
    
    if (metrics.packetLoss > this.anomalyThresholds.maxPacketLoss) {
      anomalies.push(`High packet loss: ${metrics.packetLoss}%`);
    }
    
    if (metrics.bandwidth < this.anomalyThresholds.minBandwidth) {
      anomalies.push(`Low bandwidth: ${metrics.bandwidth}kbps`);
    }
    
    if (metrics.reconnectAttempts > this.anomalyThresholds.maxReconnectAttempts) {
      anomalies.push(`Excessive reconnection attempts: ${metrics.reconnectAttempts}`);
    }
    
    if (metrics.connectionTime < this.anomalyThresholds.suspiciousConnectionTimeThreshold) {
      anomalies.push(`Suspiciously fast connection: ${metrics.connectionTime}ms`);
    }
    
    // Update security level based on anomalies
    if (anomalies.length >= 3) {
      metrics.securityLevel = 'low';
      console.error(`[SECURITY WARNING] Connection to peer ${peerId} has multiple security issues:`, anomalies);
    } else if (anomalies.length > 0) {
      metrics.securityLevel = 'medium';
      console.warn(`[SECURITY NOTICE] Connection to peer ${peerId} has potential issues:`, anomalies);
    } else {
      metrics.securityLevel = 'high';
    }
    
    this.connections.set(peerId, metrics);
  }
  
  /**
   * Get the security level for a peer connection
   */
  public getSecurityLevel(peerId: string): 'high' | 'medium' | 'low' | 'unknown' {
    return this.connections.get(peerId)?.securityLevel || 'unknown';
  }
  
  /**
   * Get detailed security report for a peer
   */
  public getSecurityReport(peerId: string): ConnectionMetrics | undefined {
    return this.connections.get(peerId);
  }
  
  /**
   * Get overall security report for all connections
   */
  public getOverallSecurityReport() {
    const connections = Array.from(this.connections.entries());
    const highSecurityCount = connections.filter(([_, metrics]) => metrics.securityLevel === 'high').length;
    const mediumSecurityCount = connections.filter(([_, metrics]) => metrics.securityLevel === 'medium').length;
    const lowSecurityCount = connections.filter(([_, metrics]) => metrics.securityLevel === 'low').length;
    
    return {
      totalConnections: connections.length,
      securityLevels: {
        high: highSecurityCount,
        medium: mediumSecurityCount,
        low: lowSecurityCount,
      },
      percentageSecure: connections.length ? 
        (highSecurityCount / connections.length) * 100 : 100
    };
  }
  
  /**
   * Clear monitoring data for a peer
   */
  public clearPeerData(peerId: string): void {
    this.connections.delete(peerId);
  }
  
  /**
   * Reset all monitoring data
   */
  public reset(): void {
    this.connections.clear();
  }
}

// Create singleton instance
const secureConnectionMonitorInstance = new SecureConnectionMonitor();
export default secureConnectionMonitorInstance;
