
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Typing indicator hook that works similar to Telegram and Signal
export const useTypingIndicator = (currentUserId: string, receiverId: string | undefined) => {
  const [peerIsTyping, setPeerIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingEventRef = useRef<number>(0);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle receiving typing indicator events
  useEffect(() => {
    if (!currentUserId || !receiverId) return;
    
    // Subscribe to typing channel
    const typingChannel = supabase
      .channel(`typing:${currentUserId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.sender === receiverId) {
          setPeerIsTyping(true);
          
          // Auto-clear typing indicator after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setPeerIsTyping(false);
          }, 3000);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [currentUserId, receiverId]);
  
  // Function to broadcast typing event
  const startTyping = useCallback(() => {
    if (!currentUserId || !receiverId) return;
    
    const now = Date.now();
    
    // Throttle typing events to max 1 per second
    if (now - lastTypingEventRef.current < 1000) {
      return;
    }
    
    lastTypingEventRef.current = now;
    
    // Broadcast typing event
    supabase
      .channel(`typing:${receiverId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender: currentUserId }
      })
      .catch(error => {
        console.error('Error sending typing event:', error);
      });
  }, [currentUserId, receiverId]);
  
  return { peerIsTyping, startTyping };
};
