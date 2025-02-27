
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptMessage } from "@/utils/encryption";

export const useMessageSend = (
  userId: string | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  ttl: number | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  const handleSendMessage = useCallback(async (webRTCManager: any, onlineUsers: Set<string>, mediaFile?: File, receiverId?: string, groupId?: string) => {
    if ((!newMessage.trim() && !mediaFile) || !userId) {
      console.log("Ingen melding eller fil å sende, eller bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        mediaUrl = filePath;
        mediaType = mediaFile.type;
      }

      if (webRTCManager && !receiverId && !groupId) {
        onlineUsers.forEach(peerId => {
          if (peerId !== userId) {
            webRTCManager.sendMessage(peerId, newMessage.trim());
          }
        });
      }

      const { encryptedContent, key, iv } = await encryptMessage(newMessage.trim());
      
      const { error } = await supabase
        .from('messages')
        .insert({
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          sender_id: userId,
          ephemeral_ttl: ttl,
          media_url: mediaUrl,
          media_type: mediaType,
          receiver_id: receiverId,
          group_id: groupId
        });

      if (error) {
        console.error('Send message error:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke sende melding: " + error.message,
          variant: "destructive",
        });
      } else {
        console.log("Melding sendt vellykket");
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [newMessage, userId, ttl, setNewMessage, setIsLoading, toast]);

  const handleEditMessage = useCallback(async (
    messageId: string,
    content: string,
  ) => {
    if (!content.trim() || !userId) {
      console.log("Ingen melding å redigere, eller bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      const { encryptedContent, key, iv } = await encryptMessage(content.trim());
      
      // Først må vi sikre at de nødvendige kolonnene finnes i databasen
      try {
        // Sjekk om "is_edited" og "edited_at" kolonnene eksisterer
        await supabase.rpc('check_and_add_columns', { 
          table_name: 'messages', 
          column_names: ['is_edited', 'edited_at'] 
        });
      } catch (error) {
        console.log('Error checking columns, continuing anyway:', error);
      }
      
      const { error } = await supabase
        .from('messages')
        .update({
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId); // Sikre at kun avsender kan redigere

      if (error) {
        console.error('Edit message error:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke redigere melding: " + error.message,
          variant: "destructive",
        });
      } else {
        console.log("Melding redigert");
        setNewMessage("");
        toast({
          title: "Redigert",
          description: "Meldingen ble redigert",
        });
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke redigere melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setNewMessage, setIsLoading, toast]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      // Vi trenger å sjekke om vi har kolonner for sletting
      try {
        // Sjekk om "is_deleted" og "deleted_at" kolonnene eksisterer
        await supabase.rpc('check_and_add_columns', { 
          table_name: 'messages', 
          column_names: ['is_deleted', 'deleted_at'] 
        });
      } catch (error) {
        console.log('Error checking columns, continuing anyway:', error);
      }
      
      // Siden vi kan ha problemer med databasekolonner, bruker vi en SQL RPC-funksjon
      const { error } = await supabase.rpc('mark_message_as_deleted', {
        message_id: messageId,
        user_id: userId
      });

      if (error) {
        console.error('Delete message error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast]);

  return { 
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage
  };
};
