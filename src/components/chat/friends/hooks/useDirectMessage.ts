
import { useState, useRef, useEffect } from "react";
import { Friend } from "../types";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";
import { useToast } from "@/components/ui/use-toast";
import { useConnectionState, setupConnectionTimeout } from "../utils/directMessage-connection-utils";
import { useDirectMessageSender } from "./useDirectMessageSender";
import { useTypingIndicator } from "@/hooks/message/useTypingIndicator";
import { useReadReceipts } from "@/hooks/message/useReadReceipts";
import { useMessageEditor } from "@/hooks/message/useMessageEditor";
import { useMessageDeleter } from "@/hooks/message/useMessageDeleter";

export const useDirectMessage = (
  friend: Friend,
  currentUserId: string,
  webRTCManager: WebRTCManager | null,
  onNewMessage: (message: DecryptedMessage) => void,
  messages: DecryptedMessage[] = []
) => {
  const [newMessage, setNewMessage] = useState("");
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [dataChannelState, setDataChannelState] = useState<string>("connecting");
  const [usingServerFallback, setUsingServerFallback] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();
  
  // Add editing message state
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);

  const { updateConnectionStatus, attemptReconnect } = useConnectionState(webRTCManager, friendId, toast);
  
  const { 
    isLoading: sendLoading, 
    sendError, 
    handleSendMessage,
    clearSendError
  } = useDirectMessageSender(
    currentUserId, 
    friendId, 
    webRTCManager, 
    usingServerFallback, 
    onNewMessage
  );
  
  // Initialize the message editor and deleter hooks
  const { handleEditMessage } = useMessageEditor(
    currentUserId,
    newMessage,
    setNewMessage,
    (loading) => setIsLoading(loading),
    toast
  );
  
  const { handleDeleteMessage } = useMessageDeleter(
    currentUserId,
    (loading) => setIsLoading(loading),
    toast
  );
  
  // Add typing indicator
  const { peerIsTyping, startTyping } = useTypingIndicator(currentUserId, friendId);
  
  // Add read receipts
  const { isMessageRead, markMessagesAsRead } = useReadReceipts(currentUserId, friendId, messages);

  // Combined loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    markMessagesAsRead();
  }, [messages]);

  useEffect(() => {
    if (!webRTCManager || !friendId) return;

    // Initial update of connection status
    const { connState, dataState } = updateConnectionStatus();
    setConnectionState(connState);
    setDataChannelState(dataState);
    
    // Set up interval to check connection status
    statusCheckInterval.current = setInterval(() => {
      const { connState, dataState } = updateConnectionStatus();
      setConnectionState(connState);
      setDataChannelState(dataState);
      
      if (connState === 'connected' && dataState === 'open') {
        setUsingServerFallback(false);
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }
      }
    }, 2000);

    // Set up connection timeout
    connectionTimeout.current = setupConnectionTimeout(
      webRTCManager, 
      friendId, 
      setUsingServerFallback, 
      toast
    );

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
    };
  }, [webRTCManager, friendId, toast]);

  const handleReconnect = async () => {
    if (!webRTCManager || !friendId) return;
    
    setConnectionAttempts(prev => prev + 1);
    const success = await attemptReconnect(usingServerFallback, setUsingServerFallback);
    
    if (success && connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = setupConnectionTimeout(
        webRTCManager, 
        friendId, 
        setUsingServerFallback, 
        toast, 
        5000
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMessage) {
      // Handle edit submission
      const success = await handleEditMessage(editingMessage.id, newMessage);
      if (success) {
        setEditingMessage(null);
        setNewMessage("");
        // Update the message locally for immediate feedback
        onNewMessage({
          ...messages.find(m => m.id === editingMessage.id)!,
          content: newMessage,
          is_edited: true,
          edited_at: new Date().toISOString()
        });
      }
    } else {
      // Handle new message submission
      const success = await handleSendMessage(e, newMessage);
      if (success) {
        setNewMessage("");
      }
    }
  };
  
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
  
  // Delete a message
  const handleDeleteMessage = async (messageId: string) => {
    const success = await handleDeleteMessage(messageId);
    if (success) {
      // Update local state to show the message as deleted
      onNewMessage({
        ...messages.find(m => m.id === messageId)!,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: "Denne meldingen er slettet"
      });
    }
  };
  
  // Handle input changes, trigger typing indicator
  const handleInputChange = (text: string) => {
    setNewMessage(text);
    startTyping();
  };

  return {
    newMessage,
    setNewMessage: handleInputChange,
    isLoading: isLoading || sendLoading,
    connectionState,
    dataChannelState,
    usingServerFallback,
    connectionAttempts,
    sendError,
    handleSendMessage: handleSubmit,
    handleReconnect,
    peerIsTyping,
    isMessageRead,
    // Add editing and deletion functionality
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleDeleteMessage
  };
};
