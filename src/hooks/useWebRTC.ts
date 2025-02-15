
import { useState } from "react";
import { WebRTCManager } from "@/utils/webrtc";
import { supabase } from "@/integrations/supabase/client";

export const useWebRTC = (userId: string | null, onMessageReceived: (message: string, peerId: string) => void) => {
  const [webRTCManager, setWebRTCManager] = useState<WebRTCManager | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const setupPresenceChannel = (currentUserId: string) => {
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
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set(prev).add(key));
        if (webRTCManager && key !== currentUserId) {
          const publicKey = webRTCManager.getPublicKey();
          if (publicKey) {
            webRTCManager.connectToPeer(key, publicKey);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        if (webRTCManager) {
          webRTCManager.disconnect(key);
        }
      })
      .subscribe();

    const status = {
      online_at: new Date().toISOString(),
      publicKey: webRTCManager?.getPublicKey()
    };

    channel.track(status);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const initializeWebRTC = (userId: string) => {
    const rtcManager = new WebRTCManager(userId);
    rtcManager.onMessage(onMessageReceived);
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
