
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage, Message } from "@/types/message";

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
                media_url,
                media_type,
                receiver_id,
                sender:profiles(id, username, full_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()
              .returns<Message>();

            if (error) {
              console.error("Feil ved henting av ny melding:", error);
              return;
            }

            if (data) {
              console.log("Dekrypterer ny melding:", data);
              try {
                const content = data.encryption_key && data.iv
                  ? await decryptMessage({
                      encrypted_content: data.encrypted_content,
                      encryption_key: data.encryption_key,
                      iv: data.iv
                    })
                  : data.encrypted_content;
                
                const decryptedMessage: DecryptedMessage = {
                  id: data.id,
                  content,
                  encryption_key: data.encryption_key,
                  iv: data.iv,
                  created_at: data.created_at,
                  ephemeral_ttl: data.ephemeral_ttl,
                  media_url: data.media_url,
                  media_type: data.media_type,
                  receiver_id: data.receiver_id,
                  sender: data.sender
                };
                
                setMessages(prev => [...prev, decryptedMessage]);
              } catch (error) {
                console.error("Decryption error for new message:", error);
                const errorMessage: DecryptedMessage = {
                  id: data.id,
                  content: "[Krypteringsfeil]",
                  encryption_key: data.encryption_key,
                  iv: data.iv,
                  created_at: data.created_at,
                  ephemeral_ttl: data.ephemeral_ttl,
                  media_url: data.media_url,
                  media_type: data.media_type,
                  receiver_id: data.receiver_id,
                  sender: data.sender
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
