
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
    if (!webRTCManager || !friendId) return false;
    
    try {
      const connState = webRTCManager.getConnectionState(friendId);
      const dataState = webRTCManager.getDataChannelState(friendId);
      
      if (connState === 'connected' && dataState === 'open') {
        await webRTCManager.sendDirectMessage(friendId, message);
        return true;
      } else {
        console.log(`Connection not ready (${connState}/${dataState}), trying to reconnect`);
        await webRTCManager.attemptReconnect(friendId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newConnState = webRTCManager.getConnectionState(friendId);
        const newDataState = webRTCManager.getDataChannelState(friendId);
        
        if (newConnState === 'connected' && newDataState === 'open') {
          await webRTCManager.sendDirectMessage(friendId, message);
          return true;
        }
      }
    } catch (error) {
      console.error('Error sending P2P message:', error);
    }
    
    return false;
  };

  const sendMessageViaServer = async (message: string): Promise<boolean> => {
    if (!currentUserId || !friendId) return false;
    
    try {
      // Encrypt message for server transmission
      const { encryptedContent, key, iv } = await encryptMessage(message.trim());
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: friendId,
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          is_encrypted: true
        });
      
      if (error) {
        throw error;
      }
      
      console.log('Message sent via server with end-to-end encryption');
      return true;
    } catch (error) {
      console.error('Server fallback failed:', error);
      return false;
    }
  };

  const handleSendMessage = async (e: React.FormEvent, message: string) => {
    e.preventDefault();
    if (!message.trim() || !friendId || !currentUserId) return;
    
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
        is_encrypted: true
      };
      
      if (webRTCManager && !usingServerFallback) {
        messageDelivered = await sendMessageViaP2P(message);
      }
      
      if (!messageDelivered) {
        messageDelivered = await sendMessageViaServer(message);
      }
      
      if (messageDelivered) {
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
