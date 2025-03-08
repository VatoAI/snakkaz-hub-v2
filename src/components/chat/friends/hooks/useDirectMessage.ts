
import { useRef, useEffect } from "react";
import { Friend } from "../types";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";
import { useToast } from "@/components/ui/use-toast";
import { useDirectMessageState } from "./useDirectMessageState";
import { useDirectMessageConnection } from "./useDirectMessageConnection";
import { useDirectMessageSubmit } from "./useDirectMessageSubmit";
import { useDirectMessageSender } from "./useDirectMessageSender";
import { useTypingIndicator } from "@/hooks/message/useTypingIndicator";
import { useReadReceipts } from "@/hooks/message/useReadReceipts";

export const useDirectMessage = (
  friend: Friend,
  currentUserId: string,
  webRTCManager: WebRTCManager | null,
  onNewMessage: (message: DecryptedMessage) => void,
  messages: DecryptedMessage[] = []
) => {
  const { toast } = useToast();
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;

  const {
    newMessage,
    setNewMessage,
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
    handleCancelEditMessage,
  } = useDirectMessageState(currentUserId, friendId);

  // Set up connection management
  const { handleReconnect } = useDirectMessageConnection(
    webRTCManager,
    friendId,
    connectionState,
    setConnectionState,
    dataChannelState,
    setDataChannelState,
    usingServerFallback,
    setUsingServerFallback,
    connectionAttempts,
    setConnectionAttempts
  );

  // Add typing indicator
  const { peerIsTyping, startTyping } = useTypingIndicator(currentUserId, friendId);
  
  // Add read receipts
  const { isMessageRead, markMessagesAsRead } = useReadReceipts(currentUserId, friendId, messages);

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead, messages]);

  // Message sending functionality - fix by removing unnecessary arguments
  const { 
    sendError, 
    handleSendMessage: handleSendDirectMessage
  } = useDirectMessageSender(
    currentUserId, 
    friendId, 
    onNewMessage
  );

  // Handle form submission (edit/send)
  const { handleSubmit, handleDeleteMessage } = useDirectMessageSubmit(
    currentUserId,
    newMessage,
    (text: string) => setNewMessage(text, startTyping),
    setIsLoading,
    editingMessage,
    (msg) => {
      if (msg === null) {
        handleCancelEditMessage();
      }
    },
    handleSendDirectMessage
  );

  return {
    newMessage,
    setNewMessage: (text: string) => setNewMessage(text, startTyping),
    isLoading,
    connectionState,
    dataChannelState,
    usingServerFallback,
    connectionAttempts,
    sendError,
    handleSendMessage: handleSubmit,
    handleReconnect,
    peerIsTyping,
    isMessageRead,
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleDeleteMessage
  };
};
