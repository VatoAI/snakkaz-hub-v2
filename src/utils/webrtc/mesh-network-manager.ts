import { ConnectionQuality } from './connection-quality-monitor';

export interface MeshNode {
  id: string;
  connections: Set<string>;
  quality: ConnectionQuality | null;
}

export class MeshNetworkManager {
  private nodes: Map<string, MeshNode> = new Map();
  private static readonly MAX_HOPS = 3;
  private static readonly QUALITY_THRESHOLD = 0.7;

  constructor() {
    this.initializeMesh();
  }

  private initializeMesh() {
    // Start with an empty mesh
    this.nodes.clear();
  }

  public addNode(nodeId: string) {
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, {
        id: nodeId,
        connections: new Set(),
        quality: null
      });
    }
  }

  public removeNode(nodeId: string) {
    const node = this.nodes.get(nodeId);
    if (node) {
      // Remove connections to this node from all other nodes
      for (const connection of node.connections) {
        const connectedNode = this.nodes.get(connection);
        if (connectedNode) {
          connectedNode.connections.delete(nodeId);
        }
      }
      this.nodes.delete(nodeId);
    }
  }

  public addConnection(nodeId1: string, nodeId2: string) {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);

    if (node1 && node2) {
      node1.connections.add(nodeId2);
      node2.connections.add(nodeId1);
    }
  }

  public removeConnection(nodeId1: string, nodeId2: string) {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);

    if (node1 && node2) {
      node1.connections.delete(nodeId2);
      node2.connections.delete(nodeId1);
    }
  }

  public updateNodeQuality(nodeId: string, quality: ConnectionQuality) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.quality = quality;
    }
  }

  public findOptimalPath(sourceId: string, targetId: string): string[] | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }

    const visited = new Set<string>();
    const queue: { path: string[]; quality: number }[] = [
      { path: [sourceId], quality: 1 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const lastNode = current.path[current.path.length - 1];

      if (lastNode === targetId) {
        return current.path;
      }

      if (current.path.length > MeshNetworkManager.MAX_HOPS) {
        continue;
      }

      const node = this.nodes.get(lastNode);
      if (!node) continue;

      for (const neighborId of node.connections) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const neighbor = this.nodes.get(neighborId);
          if (!neighbor || !neighbor.quality) continue;

          const quality = this.calculatePathQuality(current.quality, neighbor.quality);
          if (quality >= MeshNetworkManager.QUALITY_THRESHOLD) {
            queue.push({
              path: [...current.path, neighborId],
              quality
            });
          }
        }
      }
    }

    return null;
  }

  private calculatePathQuality(currentQuality: number, nodeQuality: ConnectionQuality): number {
    // Calculate path quality based on multiple factors
    const latencyFactor = this.calculateLatencyFactor(nodeQuality.latency);
    const packetLossFactor = this.calculatePacketLossFactor(nodeQuality.packetLoss);
    const bandwidthFactor = this.calculateBandwidthFactor(nodeQuality.bandwidth);

    // Combine factors with weights
    const quality = (latencyFactor * 0.4 + packetLossFactor * 0.4 + bandwidthFactor * 0.2);
    return currentQuality * quality;
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

  public getNodeConnections(nodeId: string): string[] {
    const node = this.nodes.get(nodeId);
    return node ? Array.from(node.connections) : [];
  }

  public getNetworkStats() {
    const stats = {
      totalNodes: this.nodes.size,
      totalConnections: 0,
      averageConnections: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      }
    };

    for (const node of this.nodes.values()) {
      stats.totalConnections += node.connections.size;
      if (node.quality) {
        const quality = this.calculatePathQuality(1, node.quality);
        if (quality >= 0.8) stats.qualityDistribution.excellent++;
        else if (quality >= 0.6) stats.qualityDistribution.good++;
        else if (quality >= 0.4) stats.qualityDistribution.fair++;
        else stats.qualityDistribution.poor++;
      }
    }

    stats.averageConnections = stats.totalConnections / stats.totalNodes;
    return stats;
  }
} 