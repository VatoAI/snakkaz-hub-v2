
import SimplePeer from 'simple-peer';
import type { Database } from '@/integrations/supabase/types';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

export type SignalingInsert = Database['public']['Tables']['signaling']['Insert'];

// WebRTC polyfill
export const wrtc = {
  RTCPeerConnection: window.RTCPeerConnection,
  RTCSessionDescription: window.RTCSessionDescription,
  RTCIceCandidate: window.RTCIceCandidate,
};
