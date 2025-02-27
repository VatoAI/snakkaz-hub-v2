
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DecryptedMessage } from "@/types/message";
import { decryptMessage } from "@/utils/encryption";

export const useMessageFetch = (
  userId: string | null, 
  setMessages: (updater: React.SetStateAction<DecryptedMessage[]>) => void,
  toast: any,
  receiverId?: string,
  groupId?: string
) => {
  const fetchMessages = useCallback(async () => {
    if (!userId) {
      console.log("User not authenticated");
      return;
    }

    try {
      // Først, kontroller at nødvendige kolonner eksisterer
      try {
        await supabase.rpc('check_and_add_columns', { 
          p_table_name: 'messages', 
          column_names: ['is_edited', 'edited_at', 'is_deleted', 'deleted_at', 'group_id'] as any
        });
      } catch (error) {
        console.log('Error checking columns, continuing anyway:', error);
      }

      // Nå kan vi hente meldingene
      let query = supabase
        .from('messages')
        .select(`
          id,
          encrypted_content,
          encryption_key,
          iv,
          created_at,
          ephemeral_ttl,
          media_url,
          media_type,
          receiver_id,
          is_edited,
          edited_at,
          is_deleted,
          deleted_at,
          group_id,
          sender:sender_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true });

      // Hvis receiverId er angitt, hent bare meldinger mellom bruker og mottaker
      if (receiverId) {
        query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`);
      } 
      // Hvis groupId er angitt, hent bare meldinger for den gruppen
      else if (groupId) {
        // groupId blir behandlet som en UUID-streng, men i databasen er det lagret som en streng
        query = query.eq('group_id', groupId);
      } 
      // Ellers, hent globale meldinger (null receiver og null group)
      else {
        query = query.is('receiver_id', null).is('group_id', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Decrypt messages
      const decryptedMessages: (DecryptedMessage | null)[] = await Promise.all(
        (data || []).map(async (message: any) => {
          try {
            // Sjekk om meldingen har gått ut på dato
            if (message.ephemeral_ttl) {
              const createdAt = new Date(message.created_at).getTime();
              const expiresAt = createdAt + (message.ephemeral_ttl * 1000);
              if (Date.now() > expiresAt) {
                // Skip expired messages
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
              group_id: message.group_id
            };
          } catch (decryptError) {
            console.error("Error decrypting message:", decryptError);
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
        title: "Feil",
        description: "Kunne ikke hente meldinger",
        variant: "destructive",
      });
    }
  }, [userId, setMessages, toast, receiverId, groupId]);

  return { fetchMessages };
};
