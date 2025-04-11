import { useCallback } from "react";
import { SupabaseService } from "@/services/supabase.service";
import { encryptMessage } from "@/utils/encryption";

export const useMessageSend = (
  userId: string | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  ttl: number | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  const supabase = SupabaseService.getInstance();

  const handleSendMessage = useCallback(async (
    webRTCManager: any, 
    onlineUsers: Set<string>, 
    mediaFile?: File, 
    receiverId?: string, 
    groupId?: string
  ) => {
    if ((!newMessage.trim() && !mediaFile) || !userId) {
      console.log("Ingen melding eller fil å sende, eller bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        try {
          mediaUrl = await supabase.uploadMedia(mediaFile, 'chat-media');
          mediaType = mediaFile.type;
        } catch (error) {
          console.error('Error uploading media:', error);
          toast({
            title: "Feil ved opplasting av media",
            description: "Kunne ikke laste opp filen. Prøv igjen senere.",
            variant: "destructive"
          });
          return;
        }
      }

      // Send message to online peers if using WebRTC and not in a direct chat
      if (webRTCManager && !receiverId) {
        onlineUsers.forEach(peerId => {
          if (peerId !== userId) {
            webRTCManager.sendMessage(peerId, newMessage.trim());
          }
        });
      }

      const { encryptedContent, key, iv } = await encryptMessage(newMessage.trim());
      
      await supabase.sendMessage({
        content: newMessage.trim(),
        senderId: userId,
        receiverId,
        groupId: groupId || undefined,
        encryptedContent,
        encryptionKey: key,
        iv,
        ttl,
        mediaUrl,
        mediaType
      });

      setNewMessage('');
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Feil ved sending av melding",
        description: "Kunne ikke sende meldingen. Prøv igjen senere.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [userId, newMessage, ttl, setNewMessage, setIsLoading, toast, supabase]);

  return {
    handleSendMessage
  };
};
