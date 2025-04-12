
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

      if (webRTCManager && !receiverId) {
        onlineUsers.forEach(peerId => {
          if (peerId !== userId) {
            webRTCManager.sendMessage(peerId, newMessage.trim());
          }
        });
      }

      const result = await encryptMessage(newMessage.trim());
      
      const { error } = await supabase
        .from('messages')
        .insert({
          encrypted_content: result.encryptedContent,
          encryption_key: result.key,
          iv: result.iv,
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

  return { handleSendMessage };
};
