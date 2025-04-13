
import { useMessageState } from "./message/useMessageState";
import { useMessageFetch } from "./message/useMessageFetch";
import { useMessageRealtime } from "./message/useMessageRealtime";
import { useMessageP2P } from "./message/useMessageP2P";
import { useMessageExpiry } from "./message/useMessageExpiry";
import { useMessageActions } from "./message/useMessageActions";
import { DecryptedMessage } from "@/types/message";
import { useMessageSend } from "./useMessageSend";

export const useMessages = (userId: string | null, receiverId?: string, groupId?: string) => {
  const {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isLoading,
    setIsLoading,
    ttl,
    setTtl,
    toast
  } = useMessageState();

  // Fetch messages from the server
  const { fetchMessages } = useMessageFetch(userId, setMessages, toast, receiverId, groupId);
  
  // Setup realtime subscription
  const { setupRealtimeSubscription } = useMessageRealtime(userId, setMessages, receiverId, groupId);
  
  // Message sending
  const { handleSendMessage } = useMessageSend(
    userId, newMessage, setNewMessage, ttl, setIsLoading, toast
  );
  
  // P2P message handling
  const { addP2PMessage } = useMessageP2P(setMessages);
  
  // Message expiry handling
  const { handleMessageExpired } = useMessageExpiry(setMessages);
  
  // Message editing and deletion actions
  const { 
    editingMessage, 
    handleStartEditMessage, 
    handleCancelEditMessage,
    handleSubmitEditMessage,
    handleDeleteMessageById
  } = useMessageActions(userId, null, null); // Pass null for now since we don't have edit/delete functions
  
  // Handle message submission (new or edit)
  const handleSubmitMessage = async (webRTCManager: any, onlineUsers: Set<string>, mediaFile?: File) => {
    if (editingMessage) {
      await handleSubmitEditMessage(newMessage);
    } else {
      await handleSendMessage(webRTCManager, onlineUsers, mediaFile, receiverId, groupId);
    }
  };

  return {
    // Message state
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    ttl,
    setTtl,
    
    // Message operations
    fetchMessages,
    setupRealtimeSubscription,
    addP2PMessage,
    handleSendMessage: handleSubmitMessage,
    handleMessageExpired,
    
    // Editing and deletion
    editingMessage,
    // Fix here - pass the entire message object or a simplified version with id and content
    handleStartEditMessage: (message: DecryptedMessage | { id: string; content: string }) => {
      setNewMessage(handleStartEditMessage(message));
    },
    handleCancelEditMessage,
    handleDeleteMessage: handleDeleteMessageById
  };
};
