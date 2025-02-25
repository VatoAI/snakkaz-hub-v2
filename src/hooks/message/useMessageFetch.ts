
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage, Message } from "@/types/message";

export const useMessageFetch = (
  userId: string | null,
  setMessages: (messages: DecryptedMessage[]) => void,
  toast: any,
  receiverId?: string | null
) => {
  const fetchMessages = useCallback(async () => {
    if (!userId) {
      console.log("Ingen bruker pålogget, hopper over meldingshenting");
      return;
    }

    console.log("Henter meldinger...");
    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          encrypted_content,
          encryption_key,
          iv,
          ephemeral_ttl,
          created_at,
          media_url,
          media_type,
          receiver_id,
          sender:profiles(username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: true });

      if (receiverId) {
        // Hent private meldinger mellom to brukere
        query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`);
      } else {
        // Hent offentlige meldinger (receiver_id er null)
        query = query.is('receiver_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Feil ved henting av meldinger:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste meldinger: " + error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        console.log("Ingen meldinger funnet");
        setMessages([]);
        return;
      }

      const decryptedMessages = await Promise.all(
        data.map(async (message: Message) => {
          try {
            const content = message.encryption_key && message.iv
              ? await decryptMessage({
                  encrypted_content: message.encrypted_content,
                  encryption_key: message.encryption_key,
                  iv: message.iv
                })
              : message.encrypted_content;
            
            return {
              ...message,
              content: content || "[Krypteringsfeil]"
            } as DecryptedMessage;
          } catch (error) {
            console.error("Decryption error:", error);
            return {
              ...message,
              content: "[Krypteringsfeil]"
            } as DecryptedMessage;
          }
        })
      );
      
      setMessages(decryptedMessages);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Uventet feil",
        description: "Det oppstod en feil ved lasting av meldinger",
        variant: "destructive",
      });
    }
  }, [userId, setMessages, toast, receiverId]);

  return { fetchMessages };
};
