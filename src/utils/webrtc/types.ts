
import SimplePeer from 'simple-peer';
import type { Database } from '@/integrations/supabase/types';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

export type SignalingInsert = Database['public']['Tables']['signaling']['Insert'];

// Only define WebRTC types, don't try to polyfill
export type WebRTCTypes = {
  RTCPeerConnection: typeof RTCPeerConnection;
  RTCSessionDescription: typeof RTCSessionDescription;
  RTCIceCandidate: typeof RTCIceCandidate;
};
