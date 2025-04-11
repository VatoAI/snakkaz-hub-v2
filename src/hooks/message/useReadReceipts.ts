
import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DecryptedMessage } from "@/types/message";

export const useReadReceipts = (
  currentUserId: string, 
  friendId: string | undefined,
  messages: DecryptedMessage[]
) => {
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const processingRef = useRef<boolean>(false);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!currentUserId || !friendId || processingRef.current) return;
    
    // Mark unread messages from the friend as read
    const unreadMessages = messages.filter(msg => 
      msg.sender.id === friendId && // Message is from friend
      msg.receiver_id === currentUserId && // Message is for current user
      !msg.read_at // Message isn't already marked as read
    );
    
    if (unreadMessages.length === 0) return;
    
    processingRef.current = true;
    
    try {
      // Update messages in database to mark as read
      for (const message of unreadMessages) {
        await supabase.rpc('mark_message_as_read', { message_id: message.id });
        
        // Add to local read messages set
        setReadMessages(prev => {
          const updated = new Set(prev);
          updated.add(message.id);
          return updated;
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    } finally {
      processingRef.current = false;
    }
  }, [currentUserId, friendId, messages]);
  
  // Update read messages set from fetched messages
  useEffect(() => {
    const alreadyReadMessages = messages
      .filter(msg => msg.read_at)
      .map(msg => msg.id);
      
    if (alreadyReadMessages.length > 0) {
      setReadMessages(prev => {
        const updated = new Set(prev);
        alreadyReadMessages.forEach(id => updated.add(id));
        return updated;
      });
    }
  }, [messages]);
  
  // Check if a specific message is read
  const isMessageRead = useCallback((messageId: string) => {
    return readMessages.has(messageId);
  }, [readMessages]);
  
  return { isMessageRead, markMessagesAsRead };
};
