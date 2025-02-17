
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage } from "@/types/message";

export const useMessageFetch = (
  userId: string | null,
  setMessages: (messages: DecryptedMessage[]) => void,
  toast: any
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
          sender:profiles(username, full_name)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Feil ved henting av meldinger:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke laste meldinger: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Mottatte meldinger:", data);
      
      if (!data) {
        console.log("Ingen meldinger funnet");
        setMessages([]);
        return;
      }

      const decryptedMessages = await Promise.all(
        data.map(async (message) => {
          try {
            const content = message.encryption_key && message.iv
              ? await decryptMessage(message)
              : message.encrypted_content;
            
            return {
              ...message,
              content: content || "[Krypteringsfeil]"
            };
          } catch (error) {
            console.error("Decryption error:", error);
            return {
              ...message,
              content: "[Krypteringsfeil]"
            };
          }
        })
      );
      
      console.log("Dekrypterte meldinger:", decryptedMessages);
      setMessages(decryptedMessages);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Uventet feil",
        description: "Det oppstod en feil ved lasting av meldinger",
        variant: "destructive",
      });
    }
  }, [userId, setMessages, toast]);

  return { fetchMessages };
};
