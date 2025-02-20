
import SimplePeer from 'simple-peer';
import type { Database } from '@/integrations/supabase/types';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

export type SignalingInsert = Database['public']['Tables']['signaling']['Insert'];

// Browser-compatible WebRTC implementation
export const wrtc = typeof window !== 'undefined' ? {
  RTCPeerConnection: window.RTCPeerConnection,
  RTCSessionDescription: window.RTCSessionDescription,
  RTCIceCandidate: window.RTCIceCandidate
} : null;
