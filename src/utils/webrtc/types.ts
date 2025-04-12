import type { Database } from '@/integrations/supabase/types';

export interface PeerConnection {
  dataChannel: RTCDataChannel | null;
  connection: RTCPeerConnection;
  peerId: string;
  close(): void;
  setDataChannel(channel: RTCDataChannel): void;
}

export interface SignalPayload {
  target: string;
  sender: string;
  type: string;
  data: any;
}

export interface ConnectionState {
  peerId: string;
  state: RTCPeerConnectionState;
  timestamp: number;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'key-exchange';
  sender: string;
  data: any;
}

export interface ConnectionStates {
  [peerId: string]: ConnectionState;
}

export interface ConnectionManager {
  retryManager: RetryManager;
  timeoutManager: TimeoutManager;
  secureConnectionManager: SecureConnectionManager;
  handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;
  establishSecureConnection(peerId: string, remotePublicKey: CryptoKey, localKeyPair: CryptoKeyPair): Promise<void>;
  getConnectedPeerIds(): string[];
  getOrCreatePeerConnection(peerId: string): PeerConnection;
  createPeerConnection(peerId: string): PeerConnection;
  disconnectAll(): void;
}

export interface RetryManager {
  maxRetries: number;
  retryDelay: number;
  shouldRetry(peerId: string): boolean;
  incrementRetryCount(peerId: string): void;
  resetRetryCount(peerId: string): void;
}

export interface TimeoutManager {
  timeoutDuration: number;
  setConnectionTimeout(peerId: string): void;
  clearConnectionTimeout(peerId: string): void;
}

export interface SecureConnectionManager {
  generateKeyPair(): Promise<CryptoKeyPair>;
  encryptData(data: any, publicKey: CryptoKey): Promise<ArrayBuffer>;
  decryptData(encryptedData: ArrayBuffer, privateKey: CryptoKey): Promise<any>;
}

export type SignalingInsert = Database['public']['Tables']['signaling']['Insert'];

export type WebRTCTypes = {
  RTCPeerConnection: typeof RTCPeerConnection;
  RTCSessionDescription: typeof RTCSessionDescription;
  RTCIceCandidate: typeof RTCIceCandidate;
};

export type ConnectionType = 'direct' | 'relay' | 'unknown';

export interface ICEConfig {
  iceServers: RTCIceServer[];
}
