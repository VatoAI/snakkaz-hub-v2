
import { useMessageState } from "./message/useMessageState";
import { useMessageFetch } from "./message/useMessageFetch";
import { useMessageRealtime } from "./message/useMessageRealtime";
import { useMessageSend } from "./message/useMessageSend";
import { useMessageP2P } from "./message/useMessageP2P";
import { useMessageExpiry } from "./message/useMessageExpiry";

export const useMessages = (userId: string | null) => {
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

  const { fetchMessages } = useMessageFetch(userId, setMessages, toast);
  const { setupRealtimeSubscription } = useMessageRealtime(userId, setMessages);
  const { handleSendMessage } = useMessageSend(userId, newMessage, setNewMessage, ttl, setIsLoading, toast);
  const { addP2PMessage } = useMessageP2P(setMessages);
  const { handleMessageExpired } = useMessageExpiry(setMessages);

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    ttl,
    setTtl,
    fetchMessages,
    setupRealtimeSubscription,
    addP2PMessage,
    handleSendMessage,
    handleMessageExpired
  };
};
