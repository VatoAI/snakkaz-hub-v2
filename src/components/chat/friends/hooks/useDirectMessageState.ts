
import { useState } from "react";
import { DecryptedMessage } from "@/types/message";

export const useDirectMessageState = (
  currentUserId: string,
  friendId: string
) => {
  const [newMessage, setNewMessage] = useState("");
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [dataChannelState, setDataChannelState] = useState<string>("connecting");
  const [usingServerFallback, setUsingServerFallback] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  // Start editing a message
  const handleStartEditMessage = (message: DecryptedMessage) => {
    console.log("Starting to edit message:", message.id);
    setEditingMessage({
      id: message.id,
      content: message.content
    });
    setNewMessage(message.content);
  };
  
  // Cancel editing
  const handleCancelEditMessage = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  // Handle input changes, includes typing indicator triggering
  const handleInputChange = (text: string, startTyping?: () => void) => {
    setNewMessage(text);
    if (startTyping) {
      startTyping();
    }
  };

  return {
    newMessage,
    setNewMessage: handleInputChange,
    connectionState,
    setConnectionState,
    dataChannelState,
    setDataChannelState,
    usingServerFallback,
    setUsingServerFallback,
    connectionAttempts,
    setConnectionAttempts,
    isLoading,
    setIsLoading,
    editingMessage,
    setEditingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
  };
};
