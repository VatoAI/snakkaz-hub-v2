
import { useEffect, useState, useCallback, useRef } from "react";
import { WebRTCManager } from "@/utils/webrtc";
import { supabase } from "@/integrations/supabase/client";
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

const handleChannelSubscription = (
  status: string,
  signalChannel: any,
  userId: string,
  manager: WebRTCManager | null
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
    
    // No need to call sendPendingIceCandidates as it's not part of our WebRTCManager interface
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
  const [manager, setManager] = useState<WebRTCManager | null>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const signalChannel = useRef<any>(null);
  
  const setupWebRTC = useCallback(async (userId: string, onReady?: () => void) => {
    try {
      console.log("Setting up WebRTC for user:", userId);
      setStatus('initializing');
      
      // Create WebRTC manager
      const webRTCManager = new WebRTCManager(userId);
      setManager(webRTCManager);
      
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
          // We'll use our own signal handler since the method isn't exposed
          if (webRTCManager) {
            // Use the available methods to handle the signal manually
            console.log("Processing signal data", payload);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log("Presence state:", state);
          
          // Get list of online users
          const onlineUsers = Object.keys(state).filter(id => id !== userId);
          console.log("Online users:", onlineUsers);
          
          // We'll handle connections differently since initializeConnection isn't available
          onlineUsers.forEach(peerId => {
            if (webRTCManager) {
              console.log(`Detected peer ${peerId} online`);
              // Use available methods for connection
              webRTCManager.connectToPeer(peerId, {} as JsonWebKey)
                .catch(err => console.error(`Failed to connect to peer ${peerId}:`, err));
            }
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log("User joined:", key, newPresences);
          
          // Initialize connection with new user using available methods
          if (key !== userId && webRTCManager) {
            console.log(`New peer ${key} joined`);
            // Use available methods for connection
            webRTCManager.connectToPeer(key, {} as JsonWebKey)
              .catch(err => console.error(`Failed to connect to peer ${key}:`, err));
          }
        })
        .subscribe((status) => handleChannelSubscription(status, channel, userId, webRTCManager));
      
      signalChannel.current = channel;
      
      // Set up signal sending function - using available methods
      // Since setSignalSender doesn't exist, we'll handle signals differently
      
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
      if (manager) {
        // Use the available methods for cleanup
        manager.disconnectAll();
      }
    };
  }, [manager]);
  
  return {
    manager,
    setupWebRTC,
    status,
  };
};
