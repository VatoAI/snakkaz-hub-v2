
import { useCallback } from "react";
import { SupabaseService } from "@/services/supabase.service";
import { decryptMessage } from "@/utils/encryption";
import { DecryptedMessage } from "@/types/message";

export const useMessageRealtime = (
  userId: string | null,
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void,
  receiverId?: string,
  groupId?: string
) => {
  const supabase = SupabaseService.getInstance();

  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return () => {};
    }

    // Subscribe to message changes
    const subscriptionPromise = supabase.subscribeToMessages(
      async (payload) => {
        const { eventType, new: newMessage, old: oldMessage } = payload;

        if (eventType === 'INSERT') {
          try {
            // Get sender data
            const senderData = await supabase.getProfile(newMessage.sender_id);
            
            if (!senderData) {
              console.error("Could not find sender data");
              return;
            }

            const content = await decryptMessage(
              newMessage.encrypted_content,
              newMessage.encryption_key
            );

            const decryptedMessage: DecryptedMessage = {
              id: newMessage.id,
              content,
              sender: senderData,
              created_at: newMessage.created_at,
              encryption_key: newMessage.encryption_key,
              iv: newMessage.iv,
              ephemeral_ttl: newMessage.ephemeral_ttl,
              media_url: newMessage.media_url,
              media_type: newMessage.media_type,
              is_edited: newMessage.is_edited || false,
              edited_at: newMessage.edited_at || null,
              is_deleted: newMessage.is_deleted || false,
              deleted_at: newMessage.deleted_at || null,
              receiver_id: newMessage.receiver_id,
              group_id: newMessage.group_id,
              read_at: newMessage.read_at,
              is_delivered: newMessage.is_delivered || false
            };

            setMessages(prev => [...prev, decryptedMessage]);
          } catch (error) {
            console.error("Error processing realtime message:", error);
          }
        } else if (eventType === 'UPDATE') {
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (msg.id === newMessage.id) {
                // If the content was updated, decrypt it
                if (newMessage.encrypted_content && newMessage.encryption_key) {
                  // Use a promise to update the message content
                  decryptMessage(
                    newMessage.encrypted_content,
                    newMessage.encryption_key
                  ).then(content => {
                    setMessages(prev => 
                      prev.map(m => 
                        m.id === newMessage.id 
                          ? { 
                              ...m, 
                              content, 
                              is_edited: newMessage.is_edited || false,
                              edited_at: newMessage.edited_at || null,
                              is_deleted: newMessage.is_deleted || false,
                              deleted_at: newMessage.deleted_at || null,
                              read_at: newMessage.read_at,
                              is_delivered: newMessage.is_delivered || false
                            } 
                          : m
                      )
                    );
                  }).catch(error => {
                    console.error("Error decrypting updated message:", error);
                  });
                }
                return msg;
              }
              return msg;
            })
          );
        } else if (eventType === 'DELETE') {
          setMessages(prev => prev.filter(msg => msg.id !== oldMessage.id));
        }
      },
      {
        userId: receiverId ? undefined : userId,
        receiverId,
        groupId
      }
    );

    // Return a cleanup function that will unsubscribe when called
    return () => {
      subscriptionPromise.then(subscription => {
        subscription.unsubscribe();
      }).catch(err => {
        console.error("Error unsubscribing:", err);
      });
    };
  }, [userId, receiverId, groupId, setMessages, supabase]);

  return { setupRealtimeSubscription };
};
