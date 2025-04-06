import { useEffect, useState, useCallback, useRef } from "react";
import { WebRTCManager } from "@/utils/webrtc";
import { supabase } from "@/integrations/supabase/client";
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

const handleChannelSubscription = (
  status: string,
  signalChannel: any,
  userId: string,
  webRTCManager: WebRTCManager
) => {
  console.log("Signaling channel subscription status:", status);
  
  // Fix the comparison here - use actual string value instead of enum
  if (status === 'SUBSCRIBED') {
    console.log("Successfully subscribed to signaling channel");
    // Announce presence to other peers
    signalChannel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
    });
    
    // Send any pending ICE candidates
    webRTCManager.sendPendingIceCandidates();
  }
  
  if (
    status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
    status === REALTIME_SUBSCRIBE_STATES.CLOSED ||
    status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR
  ) {
    console.error("Failed to subscribe to signaling channel:", status);
  }
};

// Export the hook
export const useWebRTC = () => {
  const [webRTCManager, setWebRTCManager] = useState<WebRTCManager | null>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const signalChannel = useRef<any>(null);
  
  const setupWebRTC = useCallback(async (userId: string, onReady?: () => void) => {
    try {
      console.log("Setting up WebRTC for user:", userId);
      setStatus('initializing');
      
      // Create WebRTC manager
      const manager = new WebRTCManager(userId);
      setWebRTCManager(manager);
      
      // Set up signaling channel
      const channel = supabase.channel(`webrtc:${userId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userId },
        },
      });
      
      // Handle incoming signals
      channel
        .on('broadcast', { event: 'signal' }, (payload) => {
          console.log("Received signal:", payload.type);
          manager.handleSignal(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log("Presence state:", state);
          
          // Get list of online users
          const onlineUsers = Object.keys(state).filter(id => id !== userId);
          console.log("Online users:", onlineUsers);
          
          // Initialize connections with online users
          onlineUsers.forEach(peerId => {
            manager.initializeConnection(peerId);
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log("User joined:", key, newPresences);
          
          // Initialize connection with new user
          if (key !== userId) {
            manager.initializeConnection(key);
          }
        })
        .subscribe((status) => handleChannelSubscription(status, channel, userId, manager));
      
      signalChannel.current = channel;
      
      // Set up signal sending function
      manager.setSignalSender((signal: any) => {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          ...signal,
        });
      });
      
      setStatus('ready');
      if (onReady) onReady();
      
    } catch (error) {
      console.error("Error setting up WebRTC:", error);
      setStatus('error');
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (signalChannel.current) {
        signalChannel.current.unsubscribe();
      }
      if (webRTCManager) {
        webRTCManager.cleanup();
      }
    };
  }, [webRTCManager]);
  
  return {
    manager: webRTCManager,
    setupWebRTC,
    status,
  };
};
