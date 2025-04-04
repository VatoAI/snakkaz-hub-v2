
import { useState, useEffect, useCallback, useRef } from "react";
import { WebRTCManager } from "@/utils/webrtc";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useWebRTC = (userId: string | null, onMessageReceived: (message: string, peerId: string) => void) => {
  const [webRTCManager, setWebRTCManager] = useState<WebRTCManager | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channelCleanup, setChannelCleanup] = useState<(() => void) | null>(null);
  const { toast } = useToast();
  const connectionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const connectionAttempts = useRef<Map<string, number>>(new Map());
  const managerInitialized = useRef<boolean>(false);

  // Clean up function
  const cleanup = useCallback(() => {
    if (channelCleanup) {
      channelCleanup();
    }
    
    // Clear all connection timeouts
    connectionTimeouts.current.forEach(timeout => clearTimeout(timeout));
    connectionTimeouts.current.clear();
    
    // Clear connection attempts tracking
    connectionAttempts.current.clear();
    
    // Disconnect all peers if webRTCManager exists
    if (webRTCManager) {
      webRTCManager.disconnectAll();
    }
  }, [channelCleanup, webRTCManager]);

  useEffect(() => {
    // Clean up previous channel when component unmounts or userId changes
    return cleanup;
  }, [cleanup]);

  const connectToPeer = useCallback(async (
    peerId: string, 
    publicKey: JsonWebKey | null, 
    rtcManager: WebRTCManager
  ) => {
    // Don't attempt to connect if no public key
    if (!publicKey) {
      console.log(`No public key for peer ${peerId}, skipping connection`);
      return;
    }
    
    // Track connection attempts
    const attempts = connectionAttempts.current.get(peerId) || 0;
    if (attempts >= 2) { // Max 2 automatic connection attempts
      console.log(`Max connection attempts reached for peer ${peerId}`);
      return;
    }
    
    connectionAttempts.current.set(peerId, attempts + 1);
    
    try {
      console.log(`Attempting connection to peer ${peerId}`);
      
      // Set a timeout to prevent blocking
      const timeoutPromise = new Promise<null>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 3000); // 3 seconds timeout
        
        connectionTimeouts.current.set(peerId, timeoutId);
      });
      
      // Attempt connection
      const connectionPromise = rtcManager.connectToPeer(peerId, publicKey);
      
      // Race the connection against the timeout
      await Promise.race([connectionPromise, timeoutPromise]);
      
      // Clear the timeout if connection attempt completes
      const timeoutId = connectionTimeouts.current.get(peerId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        connectionTimeouts.current.delete(peerId);
      }
      
    } catch (error) {
      console.warn(`Connection attempt to ${peerId} failed:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  const setupPresenceChannel = useCallback((currentUserId: string) => {
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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log("User joined:", key);
        setOnlineUsers(prev => new Set(prev).add(key));
        
        // Extract public key from presence data
        let publicKey = null;
        try {
          if (newPresences && newPresences.length > 0 && newPresences[0].publicKey) {
            publicKey = newPresences[0].publicKey;
          }
        } catch (e) {
          console.error("Error extracting public key from presence:", e);
        }
        
        // Avoid trying to connect to self
        if (webRTCManager && key !== currentUserId) {
          connectToPeer(key, publicKey, webRTCManager);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log("User left:", key);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        
        // Clean up connection attempts tracking
        connectionAttempts.current.delete(key);
        
        // Clear any pending timeout
        const timeout = connectionTimeouts.current.get(key);
        if (timeout) {
          clearTimeout(timeout);
          connectionTimeouts.current.delete(key);
        }
        
        if (webRTCManager) {
          webRTCManager.disconnect(key);
        }
      })
      .subscribe((status) => {
        console.log("Presence channel subscription status:", status);
        
        if (status === 'SUBSCRIBED') {
          // Add the user's public key to the presence state
          const status = {
            online_at: new Date().toISOString(),
            publicKey: webRTCManager?.getPublicKey()
          };
          
          console.log("Tracking presence with status:", status);
          channel.track(status);
        } else if (status === 'SUBSCRIPTION_ERROR') {
          toast({
            title: "Tilkobling feilet",
            description: "Kunne ikke koble til tilstedeværelsessystemet",
            variant: "destructive",
          });
        }
      });

    // Store the cleanup function
    const cleanupFn = () => {
      console.log("Cleaning up presence channel");
      supabase.removeChannel(channel);
    };
    
    setChannelCleanup(() => cleanupFn);
    return cleanupFn;
  }, [channelCleanup, webRTCManager, connectToPeer, toast]);

  const initializeWebRTC = useCallback((userId: string) => {
    console.log("Initializing WebRTC for user:", userId);
    
    // Clean up existing manager if any
    if (webRTCManager) {
      webRTCManager.disconnectAll();
    }
    
    // Reset tracking references
    connectionAttempts.current.clear();
    connectionTimeouts.current.forEach(timeout => clearTimeout(timeout));
    connectionTimeouts.current.clear();
    
    const rtcManager = new WebRTCManager(userId, { maxReconnectAttempts: 3 });
    
    rtcManager.onMessage((message, peerId) => {
      console.log(`Received message from ${peerId}`);
      onMessageReceived(message, peerId);
    });
    
    setWebRTCManager(rtcManager);
    managerInitialized.current = true;
    
    return rtcManager;
  }, [webRTCManager, onMessageReceived]);

  return {
    webRTCManager,
    onlineUsers,
    setupPresenceChannel,
    initializeWebRTC
  };
};
