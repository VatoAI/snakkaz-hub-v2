
import { useState, useRef, useCallback } from "react";

export const useDirectMessageState = (currentUserId: string, friendId: string | undefined) => {
  const [newMessage, setNewMessage] = useState("");
  const [connectionState, setConnectionState] = useState("disconnected");
  const [dataChannelState, setDataChannelState] = useState("closed");
  const [usingServerFallback, setUsingServerFallback] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  
  // Handler for starting to edit a message
  const handleStartEditMessage = (message: any) => {
    setEditingMessage({
      id: message.id,
      content: message.content
    });
    return message.content;
  };
  
  // Handler for canceling message editing
  const handleCancelEditMessage = () => {
    setEditingMessage(null);
  };
  
  // Modified setNewMessage to include typing indicator trigger
  const setNewMessageWithTyping = useCallback((text: string, startTyping?: () => void) => {
    setNewMessage(text);
    
    // If the typing function is provided, and the text is not empty, trigger typing
    if (startTyping && text.trim().length > 0) {
      startTyping();
    }
  }, []);
  
  return {
    newMessage,
    setNewMessage: setNewMessageWithTyping,
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
    handleStartEditMessage,
    handleCancelEditMessage
  };
};
