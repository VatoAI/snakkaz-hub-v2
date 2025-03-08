
import { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { encryptMessage } from "@/utils/encryption";
import { DecryptedMessage } from "@/types/message";
import { useToast } from "@/components/ui/use-toast";

export const useDirectMessageSender = (
  currentUserId: string,
  friendId: string | undefined,
  // Remove webRTCManager and usingServerFallback parameters
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
          is_deleted: false,
        })
        .select();
      
      if (error) {
        console.error('Error from server when sending message:', error);
        throw error;
      }
      
      console.log('Message sent via server with end-to-end encryption', data);
      return true;
    } catch (error) {
      console.error('Server message failed:', error);
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
        is_deleted: false,
        deleted_at: null
      };
      
      // Send via server only
      console.log('Sending message via server...');
      messageDelivered = await sendMessageViaServer(message);
      
      if (messageDelivered) {
        console.log('Message delivered successfully, updating UI');
        onNewMessage(localMessage);
        return true;
      } else {
        throw new Error('Message delivery failed');
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
