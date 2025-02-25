
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage, Message } from "@/types/message";
import { PostgrestError } from "@supabase/supabase-js";

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
      const { data, error } = await supabase
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
          sender:profiles(id, username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: true })
        .returns<Message[]>();

      if (error) {
        console.error("Feil ved henting av meldinger:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste meldinger: " + error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        console.log("Ingen meldinger funnet");
        setMessages([]);
        return;
      }

      // Filter messages based on receiverId
      const filteredMessages = receiverId
        ? data.filter(msg => 
            (msg.sender.id === userId && msg.receiver_id === receiverId) ||
            (msg.sender.id === receiverId && msg.receiver_id === userId)
          )
        : data.filter(msg => !msg.receiver_id);

      const decryptedMessages = await Promise.all(
        filteredMessages.map(async (message) => {
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
