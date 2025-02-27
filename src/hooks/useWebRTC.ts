
import { useState, useEffect } from "react";
import { WebRTCManager } from "@/utils/webrtc";
import { supabase } from "@/integrations/supabase/client";

export const useWebRTC = (userId: string | null, onMessageReceived: (message: string, peerId: string) => void) => {
  const [webRTCManager, setWebRTCManager] = useState<WebRTCManager | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channelCleanup, setChannelCleanup] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Clean up previous channel when component unmounts or userId changes
    return () => {
      if (channelCleanup) {
        channelCleanup();
      }
    };
  }, [channelCleanup]);

  const setupPresenceChannel = (currentUserId: string) => {
    // Clean up any existing channel
    if (channelCleanup) {
      channelCleanup();
    }

    console.log("Setting up presence channel for user:", currentUserId);
    
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set(Object.keys(state));
        setOnlineUsers(online);
        console.log("Presence sync, online users:", Array.from(online));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log("User joined:", key);
        setOnlineUsers(prev => new Set(prev).add(key));
        
        // Avoid trying to connect to self
        if (webRTCManager && key !== currentUserId) {
          try {
            const publicKey = webRTCManager.getPublicKey();
            if (publicKey) {
              console.log("Attempting to connect to peer:", key);
              
              // Create a timeout to prevent blocking if the connection attempt hangs
              const connectionPromise = webRTCManager.connectToPeer(key, publicKey);
              
              // Timeout after 5 seconds
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
              });

              // Race the connection against the timeout
              Promise.race([connectionPromise, timeoutPromise])
                .catch(error => {
                  console.warn(`Connection attempt to ${key} failed:`, error.message);
                });
            }
          } catch (error) {
            console.error(`Error establishing connection with ${key}:`, error);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log("User left:", key);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        
        if (webRTCManager) {
          webRTCManager.disconnect(key);
        }
      })
      .subscribe((status) => {
        console.log("Presence channel subscription status:", status);
      });

    // Add the user's public key to the presence state
    const status = {
      online_at: new Date().toISOString(),
      publicKey: webRTCManager?.getPublicKey()
    };

    console.log("Tracking presence with status:", status);
    channel.track(status);

    // Store the cleanup function
    const cleanup = () => {
      console.log("Cleaning up presence channel");
      supabase.removeChannel(channel);
    };
    
    setChannelCleanup(() => cleanup);
    return cleanup;
  };

  const initializeWebRTC = (userId: string) => {
    console.log("Initializing WebRTC for user:", userId);
    
    // Clean up existing manager if any
    if (webRTCManager) {
      webRTCManager.disconnectAll();
    }
    
    const rtcManager = new WebRTCManager(userId);
    rtcManager.onMessage((message, peerId) => {
      console.log(`Received message from ${peerId}:`, message.substring(0, 30) + (message.length > 30 ? '...' : ''));
      onMessageReceived(message, peerId);
    });
    
    setWebRTCManager(rtcManager);
    return rtcManager;
  };

  return {
    webRTCManager,
    onlineUsers,
    setupPresenceChannel,
    initializeWebRTC
  };
};
