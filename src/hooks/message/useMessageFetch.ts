import { useCallback } from "react";
import { SupabaseService } from "@/services/supabase.service";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage } from "@/types/message";

export const useMessageFetch = (
  userId: string | null,
  setMessages: (messages: DecryptedMessage[]) => void,
  toast: any,
  receiverId?: string,
  groupId?: string
) => {
  const supabase = SupabaseService.getInstance();

  const fetchMessages = useCallback(async () => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    try {
      const messages = await supabase.getMessages({
        userId,
        receiverId,
        groupId,
        limit: 50
      });

      // Decrypt messages
      const decryptedMessages: (DecryptedMessage | null)[] = await Promise.all(
        (messages || []).map(async (message: any) => {
          try {
            // Check if message has expired
            if (message.ephemeral_ttl) {
              const createdAt = new Date(message.created_at).getTime();
              const expiresAt = createdAt + (message.ephemeral_ttl * 1000);
              if (Date.now() > expiresAt) {
                return null;
              }
            }

            const content = await decryptMessage(
              message.encrypted_content,
              message.encryption_key,
              message.iv
            );

            return {
              id: message.id,
              content,
              sender: message.sender,
              created_at: message.created_at,
              encryption_key: message.encryption_key,
              iv: message.iv,
              ephemeral_ttl: message.ephemeral_ttl,
              media_url: message.media_url,
              media_type: message.media_type,
              is_edited: message.is_edited || false,
              edited_at: message.edited_at || null,
              is_deleted: message.is_deleted || false,
              deleted_at: message.deleted_at || null,
              receiver_id: message.receiver_id,
              group_id: message.group_id,
              read_at: message.read_at,
              is_delivered: message.is_delivered || false
            };
          } catch (error) {
            console.error("Error decrypting message:", error);
            return null;
          }
        })
      );

      // Filter out null messages (expired or decrypt failed)
      const validMessages = decryptedMessages.filter(msg => msg !== null) as DecryptedMessage[];
      setMessages(validMessages);

    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Feil ved henting av meldinger",
        description: "Kunne ikke hente meldingene. Prøv igjen senere.",
        variant: "destructive"
      });
    }
  }, [userId, receiverId, groupId, setMessages, toast, supabase]);

  return { fetchMessages };
};
