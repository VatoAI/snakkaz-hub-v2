
import { useState } from "react";
import { useMessageState } from "./message/useMessageState";
import { useMessageFetch } from "./message/useMessageFetch";
import { useMessageRealtime } from "./message/useMessageRealtime";
import { useMessageSend } from "./message/useMessageSend";
import { useMessageP2P } from "./message/useMessageP2P";
import { useMessageExpiry } from "./message/useMessageExpiry";
import { DecryptedMessage } from "@/types/message";

export const useMessages = (userId: string | null, receiverId?: string, groupId?: string) => {
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

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

  const { fetchMessages } = useMessageFetch(userId, setMessages, toast, receiverId, groupId);
  const { setupRealtimeSubscription } = useMessageRealtime(userId, setMessages, receiverId, groupId);
  const { handleSendMessage, handleEditMessage, handleDeleteMessage } = useMessageSend(
    userId, newMessage, setNewMessage, ttl, setIsLoading, toast
  );
  const { addP2PMessage } = useMessageP2P(setMessages);
  const { handleMessageExpired } = useMessageExpiry(setMessages);

  const handleStartEditMessage = (message: { id: string; content: string }) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleSubmitEditMessage = async () => {
    if (!editingMessage) return;
    
    await handleEditMessage(editingMessage.id, newMessage);
    setEditingMessage(null);
  };

  const handleDeleteMessageById = async (messageId: string) => {
    await handleDeleteMessage(messageId);
    // Oppdater lokalt for å få umiddelbar visuell tilbakemelding
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, is_deleted: true, deleted_at: new Date().toISOString() } 
        : msg
    ));
  };

  const handleSubmitMessage = async (webRTCManager: any, onlineUsers: Set<string>, mediaFile?: File) => {
    if (editingMessage) {
      await handleSubmitEditMessage();
    } else {
      await handleSendMessage(webRTCManager, onlineUsers, mediaFile, receiverId, groupId);
    }
  };

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
    handleSendMessage: handleSubmitMessage,
    handleMessageExpired,
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleDeleteMessage: handleDeleteMessageById
  };
};
