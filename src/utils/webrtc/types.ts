
// Basic WebRTC types
export interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  peerId: string;
  close: () => void;
  setDataChannel: (channel: RTCDataChannel) => void;
}

export interface SignalPayload {
  sender_id: string;
  receiver_id: string;
  signal_data: any;
}

export interface WebRTCOptions {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  iceServers?: RTCIceServer[];
}

export interface IWebRTCManager {
  initialize(): Promise<void>;
  connectToPeer(peerId: string, peerPublicKey: JsonWebKey): Promise<PeerConnection | null>;
  sendMessage(peerId: string, message: string, isDirect?: boolean): Promise<boolean>;
  onMessage(callback: (message: string, peerId: string) => void): void;
  sendDirectMessage(peerId: string, message: string): Promise<boolean>;
  getPublicKey(): JsonWebKey | null;
  disconnect(peerId: string): void;
  disconnectAll(): void;
  getConnectionState(peerId: string): string;
  getDataChannelState(peerId: string): string;
  attemptReconnect(peerId: string): Promise<boolean>;
  isPeerReady(peerId: string): boolean;
  ensurePeerReady(peerId: string): Promise<boolean>;
}

// Simplified PeerConnection for compatibility with existing code
export interface SimplePeerConnection {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  peerId: string;
}
