
import { useState, useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageActions = (
  userId: string | null,
  handleEditMessage: (messageId: string, content: string) => Promise<void>,
  handleDeleteMessage: (messageId: string) => Promise<void>
) => {
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  const handleStartEditMessage = (message: DecryptedMessage | { id: string; content: string }) => {
    // Check if user is the sender before allowing edit
    if ('sender' in message && message.sender.id !== userId) {
      console.log("Cannot edit message not sent by current user");
      return "";
    }

    setEditingMessage({
      id: message.id,
      content: message.content
    });
    
    return message.content;
  };

  const handleCancelEditMessage = () => {
    setEditingMessage(null);
  };

  const handleSubmitEditMessage = async (newContent: string) => {
    if (!editingMessage) return;
    
    try {
      await handleEditMessage(editingMessage.id, newContent);
      setEditingMessage(null);
    } catch (error) {
      console.error("Error submitting edit:", error);
    }
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
