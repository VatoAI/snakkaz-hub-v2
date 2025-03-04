
import { useState } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageActions = (
  userId: string | null, 
  handleEditMessage: (messageId: string, content: string) => Promise<void>,
  handleDeleteMessage: (messageId: string) => Promise<void>
) => {
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  const handleStartEditMessage = (message: { id: string; content: string }) => {
    setEditingMessage(message);
    return message.content;
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
  };

  const handleSubmitEditMessage = async (newMessage: string) => {
    if (!editingMessage) return;
    
    await handleEditMessage(editingMessage.id, newMessage);
    setEditingMessage(null);
  };

  const handleDeleteMessageById = async (messageId: string) => {
    await handleDeleteMessage(messageId);
  };

  return {
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleSubmitEditMessage,
    handleDeleteMessageById
  };
};
