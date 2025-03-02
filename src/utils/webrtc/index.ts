
import { WebRTCManager } from './webrtc-manager';
import { IWebRTCManager, WebRTCOptions } from './webrtc-types';

// Re-export WebRTCManager and related types
export { WebRTCManager, IWebRTCManager, WebRTCOptions };

// Factory function to create WebRTCManager instances
export const createWebRTCManager = (userId: string, options?: WebRTCOptions) => 
  new WebRTCManager(userId, options);
