
import { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { encryptMessage } from "@/utils/encryption";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";
import { useToast } from "@/components/ui/use-toast";

export const useDirectMessageSender = (
  currentUserId: string,
  friendId: string | undefined,
  webRTCManager: WebRTCManager | null,
  usingServerFallback: boolean,
  onNewMessage: (message: DecryptedMessage) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const { toast } = useToast();
  const errorResetTimeout = useRef<NodeJS.Timeout | null>(null);

  const clearSendError = () => {
    setSendError(null);
    if (errorResetTimeout.current) {
      clearTimeout(errorResetTimeout.current);
      errorResetTimeout.current = null;
    }
  };

  const sendMessageViaP2P = async (message: string): Promise<boolean> => {
    if (!webRTCManager || !friendId) {
      console.log('P2P message failed: Missing webRTCManager or friendId', { webRTCManager: !!webRTCManager, friendId });
      return false;
    }
    
    try {
      const connState = webRTCManager.getConnectionState(friendId);
      const dataState = webRTCManager.getDataChannelState(friendId);
      
      console.log('P2P connection state:', { connState, dataState, friendId });
      
      if (connState === 'connected' && dataState === 'open') {
        await webRTCManager.sendDirectMessage(friendId, message);
        console.log('P2P message sent successfully');
        return true;
      } else {
        console.log('Attempting reconnection before sending...');
        // Faster reconnection attempt with shorter timeout
        await webRTCManager.attemptReconnect(friendId);
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 500ms
        
        const newConnState = webRTCManager.getConnectionState(friendId);
        const newDataState = webRTCManager.getDataChannelState(friendId);
        
        console.log('P2P connection state after reconnection:', { newConnState, newDataState });
        
        if (newConnState === 'connected' && newDataState === 'open') {
          await webRTCManager.sendDirectMessage(friendId, message);
          console.log('P2P message sent after reconnection');
          return true;
        }
      }
    } catch (error) {
      console.error('Error sending P2P message:', error);
    }
    
    console.log('P2P message sending failed, will try server fallback');
    return false;
  };

  const sendMessageViaServer = async (message: string): Promise<boolean> => {
    if (!currentUserId || !friendId) {
      console.log('Server message failed: Missing currentUserId or friendId', { currentUserId, friendId });
      return false;
    }
    
    try {
      console.log('Encrypting message for server delivery...');
      const { encryptedContent, key, iv } = await encryptMessage(message.trim());
      
      console.log('Sending message via server...');
      const { error, data } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: friendId,
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          is_encrypted: true,
          read_at: null,
          is_deleted: false,  // Using is_deleted instead of is_delivered
        })
        .select();
      
      if (error) {
        console.error('Error from server when sending message:', error);
        throw error;
      }
      
      console.log('Message sent via server with end-to-end encryption', data);
      return true;
    } catch (error) {
      console.error('Server fallback failed:', error);
      return false;
    }
  };

  const handleSendMessage = async (e: React.FormEvent, message: string) => {
    e.preventDefault();
    if (!message.trim() || !friendId || !currentUserId) {
      console.log('Message sending aborted: empty message or missing IDs', { 
        messageEmpty: !message.trim(), 
        friendId, 
        currentUserId 
      });
      return false;
    }
    
    console.log('Starting message send process...');
    setIsLoading(true);
    clearSendError();
    
    try {
      let messageDelivered = false;
      
      const timestamp = new Date().toISOString();
      const localMessage: DecryptedMessage = {
        id: `local-${Date.now()}`,
        content: message,
        sender: {
          id: currentUserId,
          username: null,
          full_name: null
        },
        receiver_id: friendId,
        created_at: timestamp,
        encryption_key: '',
        iv: '',
        is_encrypted: true,
        is_deleted: false,  // Using is_deleted instead of is_delivered
        deleted_at: null
      };
      
      // First try P2P if not in server fallback mode already
      if (webRTCManager && !usingServerFallback) {
        console.log('Attempting P2P message delivery...');
        messageDelivered = await sendMessageViaP2P(message);
      }
      
      // Fall back to server delivery if P2P fails or we're already in fallback mode
      if (!messageDelivered) {
        console.log('Attempting server message delivery...');
        messageDelivered = await sendMessageViaServer(message);
        // If we weren't in fallback mode but had to fall back, set the flag
        if (!usingServerFallback && messageDelivered) {
          console.log('Switched to server fallback mode');
          toast({
            title: "Server modus",
            description: "Bruker kryptert servermodus for denne meldingen",
          });
        }
      }
      
      if (messageDelivered) {
        console.log('Message delivered successfully, updating UI');
        onNewMessage(localMessage);
        return true;
      } else {
        throw new Error('Both direct and server message delivery failed');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError('Kunne ikke sende melding. Prøv igjen senere.');
      
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding. Prøv igjen senere.",
        variant: "destructive",
      });
      
      // Auto-clear error after 5 seconds
      errorResetTimeout.current = setTimeout(() => {
        setSendError(null);
      }, 5000);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendError,
    handleSendMessage,
    clearSendError
  };
};
