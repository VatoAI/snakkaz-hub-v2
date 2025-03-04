
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DecryptedMessage } from "@/types/message";

type ReadReceipt = {
  message_id: string;
  read_at: string;
  user_id: string;
};

export const useReadReceipts = (
  userId: string | null,
  receiverId: string | undefined,
  messages: DecryptedMessage[],
  channelName: string = 'direct_read_receipts'
) => {
  const [readMessages, setReadMessages] = useState<Map<string, ReadReceipt>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const unreadMessageIds = useRef<Set<string>>(new Set());

  // Mark messages from the other user as read
  const markMessagesAsRead = async () => {
    if (!userId || !receiverId || messages.length === 0) return;
    
    // Get messages from the other user that we've received
    const otherUserMessageIds = messages
      .filter(msg => msg.sender.id === receiverId && !readMessages.has(msg.id))
      .map(msg => msg.id);
    
    if (otherUserMessageIds.length === 0) return;
    
    // Create read receipts for these messages
    const now = new Date().toISOString();
    const receipts = otherUserMessageIds.map(msgId => ({
      message_id: msgId,
      read_at: now,
      user_id: userId
    }));
    
    // Add to local state
    const updatedReadMessages = new Map(readMessages);
    receipts.forEach(receipt => {
      updatedReadMessages.set(receipt.message_id, receipt);
    });
    setReadMessages(updatedReadMessages);
    
    // Broadcast that we've read these messages
    if (channelRef.current) {
      channelRef.current.track({
        user_id: userId,
        receipts: receipts,
        timestamp: now
      }).catch(error => console.error("Error updating read receipts:", error));
    }
  };

  // Set up presence channel for read receipts
  useEffect(() => {
    if (!userId || !receiverId) return;

    const readReceiptsChannel = supabase.channel(`${channelName}:${userId}_${receiverId}`);
    
    readReceiptsChannel
      .on('presence', { event: 'sync' }, () => {
        const state = readReceiptsChannel.presenceState();
        processReadReceipts(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const presence of newPresences) {
          if (presence.user_id === receiverId && presence.receipts) {
            processUserReceipts(presence.receipts);
          }
        }
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') {
          console.error("Failed to subscribe to read receipts channel:", status);
          return;
        }
        
        // Track initial presence (empty receipts)
        await readReceiptsChannel.track({
          user_id: userId,
          receipts: [],
          timestamp: new Date().toISOString()
        });
        
        channelRef.current = readReceiptsChannel;
        
        // Mark any existing messages as read
        markMessagesAsRead();
      });
    
    // Cleanup function
    return () => {
      supabase.removeChannel(readReceiptsChannel);
    };
  }, [userId, receiverId, channelName]);

  // Process receipts when messages change
  useEffect(() => {
    // Check if there are new messages to mark as read
    const hasNewUnreadMessages = messages.some(msg => {
      return msg.sender.id === receiverId && !readMessages.has(msg.id) && !unreadMessageIds.current.has(msg.id);
    });
    
    if (hasNewUnreadMessages) {
      // Update the set of unread messages
      messages.forEach(msg => {
        if (msg.sender.id === receiverId && !readMessages.has(msg.id)) {
          unreadMessageIds.current.add(msg.id);
        }
      });
      
      // Mark messages as read
      markMessagesAsRead();
    }
  }, [messages, receiverId, readMessages]);

  // Helper function to process read receipts from presence state
  const processReadReceipts = (state: Record<string, unknown>) => {
    const updatedReadMessages = new Map(readMessages);
    
    for (const userStates of Object.values(state)) {
      for (const presenceState of userStates as any[]) {
        if (presenceState.user_id === receiverId && presenceState.receipts) {
          processUserReceipts(presenceState.receipts, updatedReadMessages);
        }
      }
    }
    
    setReadMessages(updatedReadMessages);
  };

  // Helper function to process receipts from a single user
  const processUserReceipts = (receipts: ReadReceipt[], stateMap: Map<string, ReadReceipt> = readMessages) => {
    if (!Array.isArray(receipts)) return;
    
    const updatedMap = new Map(stateMap);
    
    receipts.forEach(receipt => {
      // Only store receipts for messages sent by current user
      const message = messages.find(msg => msg.id === receipt.message_id);
      if (message && message.sender.id === userId) {
        updatedMap.set(receipt.message_id, receipt);
      }
    });
    
    setReadMessages(updatedMap);
  };

  // Check if a message has been read
  const isMessageRead = (messageId: string): boolean => {
    return readMessages.has(messageId);
  };

  return {
    readMessages,
    isMessageRead,
    markMessagesAsRead
  };
};
