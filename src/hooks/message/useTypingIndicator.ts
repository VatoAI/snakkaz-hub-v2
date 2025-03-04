
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTypingIndicator = (
  userId: string | null,
  receiverId: string | undefined,
  channelName: string = 'direct_typing'
) => {
  const [isTyping, setIsTyping] = useState(false);
  const [peerIsTyping, setPeerIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const startTyping = () => {
    if (!userId || !receiverId) return;
    
    // Update local state
    setIsTyping(true);
    
    // Clear existing timeout if any
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      
      // Broadcast stopped typing
      if (channelRef.current) {
        channelRef.current.track({
          user_id: userId,
          is_typing: false,
          timestamp: new Date().toISOString()
        }).catch(error => console.error("Error updating typing status:", error));
      }
    }, 2000);
    
    // Broadcast typing
    if (channelRef.current) {
      channelRef.current.track({
        user_id: userId,
        is_typing: true,
        timestamp: new Date().toISOString()
      }).catch(error => console.error("Error updating typing status:", error));
    }
  };

  // Setup channel for typing indicators
  useEffect(() => {
    if (!userId || !receiverId) return;

    const typingChannel = supabase.channel(`${channelName}:${userId}_${receiverId}`);
    
    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        // Process all users' states
        for (const userStates of Object.values(state)) {
          for (const presenceState of userStates as any[]) {
            if (presenceState.user_id === receiverId) {
              setPeerIsTyping(presenceState.is_typing || false);
            }
          }
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Someone joined or updated their state
        for (const presence of newPresences) {
          if (presence.user_id === receiverId) {
            setPeerIsTyping(presence.is_typing || false);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Someone left or stopped typing
        for (const presence of leftPresences) {
          if (presence.user_id === receiverId) {
            setPeerIsTyping(false);
          }
        }
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') {
          console.error("Failed to subscribe to typing channel:", status);
          return;
        }
        
        // Track initial presence
        await typingChannel.track({
          user_id: userId,
          is_typing: false,
          timestamp: new Date().toISOString()
        });
        
        channelRef.current = typingChannel;
      });
    
    // Cleanup function
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      supabase.removeChannel(typingChannel);
    };
  }, [userId, receiverId, channelName]);

  return {
    isTyping,
    peerIsTyping,
    startTyping
  };
};
