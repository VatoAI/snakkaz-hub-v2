
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DecryptedMessage } from '@/types/message';

export const useReadReceipts = (
  currentUserId: string | null, 
  friendId: string | null,
  messages: DecryptedMessage[] = []
) => {
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());

  // Mark messages as read on initial load and when new messages arrive
  useEffect(() => {
    if (!currentUserId || !friendId) return;
    
    const friendMessages = messages.filter(msg => 
      msg.sender.id === friendId && msg.receiver_id === currentUserId
    );
    
    if (friendMessages.length === 0) return;
    
    // Get message IDs that need to be marked as read
    const unreadMessageIds = friendMessages
      .filter(msg => !msg.read_at)
      .map(msg => msg.id);
    
    // Mark messages as read in the database
    const markMessagesAsRead = async () => {
      if (unreadMessageIds.length === 0) return;
      
      for (const messageId of unreadMessageIds) {
        try {
          // Use the database function to mark as read
          await supabase.rpc('mark_message_as_read', { message_id: messageId });
          
          // Update local state
          setReadMessages(prev => new Set([...prev, messageId]));
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    };
    
    markMessagesAsRead();
    
    // Set up realtime subscription for read status changes
    const channel = supabase
      .channel('read-receipts')
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        }, 
        (payload) => {
          const { new: newRecord } = payload;
          if (newRecord && newRecord.read_at) {
            setReadMessages(prev => new Set([...prev, newRecord.id]));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, friendId, messages]);

  // Function to check if a message is read
  const isMessageRead = useCallback((messageId: string) => {
    // Check our local state first
    if (readMessages.has(messageId)) {
      return true;
    }
    
    // Then check the message object in the array
    const message = messages.find(msg => msg.id === messageId);
    return message?.read_at !== null && message?.read_at !== undefined;
  }, [messages, readMessages]);

  // Function to manually mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!currentUserId || !friendId) return;
    
    const unreadFriendMessages = messages.filter(msg => 
      msg.sender.id === friendId && 
      msg.receiver_id === currentUserId && 
      !msg.read_at
    );
    
    for (const message of unreadFriendMessages) {
      try {
        await supabase.rpc('mark_message_as_read', { message_id: message.id });
        setReadMessages(prev => new Set([...prev, message.id]));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  }, [currentUserId, friendId, messages]);

  return {
    isMessageRead,
    markMessagesAsRead
  };
};
