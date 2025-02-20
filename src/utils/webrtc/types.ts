
import SimplePeer from 'simple-peer';
import type { Database } from '@/integrations/supabase/types';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
}

export type SignalingInsert = Database['public']['Tables']['signaling']['Insert'];

// WebRTC polyfill with null checks and defaults
export const wrtc = {
  RTCPeerConnection: window?.RTCPeerConnection || null,
  RTCSessionDescription: window?.RTCSessionDescription || null,
  RTCIceCandidate: window?.RTCIceCandidate || null,
  RTCRtpReceiver: window?.RTCRtpReceiver || null, // Add this
  RTCRtpSender: window?.RTCRtpSender || null,     // Add this
};
