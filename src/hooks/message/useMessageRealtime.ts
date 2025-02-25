
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage } from "@/types/message";

export const useMessageRealtime = (
  userId: string | null,
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) return () => {};

    console.log("Setter opp sanntidsabonnement...");
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log("Ny melding mottatt:", payload);
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
                sender:profiles(id, username, full_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error("Feil ved henting av ny melding:", error);
              return;
            }

            if (data) {
              console.log("Dekrypterer ny melding:", data);
              try {
                const content = data.encryption_key && data.iv
                  ? await decryptMessage(data)
                  : data.encrypted_content;
                
                const decryptedMessage: DecryptedMessage = {
                  ...data,
                  content: content || "[Krypteringsfeil]"
                };
                
                setMessages(prev => [...prev, decryptedMessage]);
              } catch (error) {
                console.error("Decryption error for new message:", error);
                const errorMessage: DecryptedMessage = {
                  ...data,
                  content: "[Krypteringsfeil]"
                };
                setMessages(prev => [...prev, errorMessage]);
              }
            }
          } catch (error) {
            console.error("Error processing new message:", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setMessages]);

  return { setupRealtimeSubscription };
};
