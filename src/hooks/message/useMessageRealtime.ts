
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DecryptedMessage } from "@/types/message";
import { decryptMessage } from "@/utils/encryption";

export const useMessageRealtime = (
  userId: string | null, 
  setMessages: (updater: React.SetStateAction<DecryptedMessage[]>) => void,
  receiverId?: string,
  groupId?: string
) => {
  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) {
      console.log("User not authenticated");
      return () => {};
    }

    let channelFilter = "*";
    if (receiverId) {
      channelFilter = `and(or(sender_id:eq:${userId},sender_id:eq:${receiverId}),or(receiver_id:eq:${userId},receiver_id:eq:${receiverId}))`;
    } else if (groupId) {
      channelFilter = `group_id:eq:${groupId}`;
    } else {
      channelFilter = `and(receiver_id:is:null,group_id:is:null)`;
    }

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: channelFilter
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Skip messages sent by this user (already in UI)
          if (newMessage.sender_id === userId) {
            return;
          }

          try {
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('id, username, full_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();

            if (senderError) {
              throw senderError;
            }

            // For private messages, only add if it's for this user
            if (newMessage.receiver_id && newMessage.receiver_id !== userId) {
              return;
            }

            // For group messages, make sure user is in the group (could be implemented further)
            
            const content = await decryptMessage(
              newMessage.encrypted_content,
              newMessage.encryption_key,
              newMessage.iv
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
              is_edited: newMessage.is_edited,
              edited_at: newMessage.edited_at,
              is_deleted: newMessage.is_deleted,
              deleted_at: newMessage.deleted_at,
              receiver_id: newMessage.receiver_id,
              group_id: newMessage.group_id
            };

            setMessages(prevMessages => [...prevMessages, decryptedMessage]);
          } catch (error) {
            console.error("Error processing realtime message:", error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const updatedMessage = payload.new as any;
          
          // Handle updates to messages (editing, deletion)
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (msg.id === updatedMessage.id) {
                // If the content was updated, decrypt it
                if (updatedMessage.encrypted_content && updatedMessage.encryption_key && updatedMessage.iv) {
                  decryptMessage(
                    updatedMessage.encrypted_content,
                    updatedMessage.encryption_key,
                    updatedMessage.iv
                  ).then(content => {
                    setMessages(prev => 
                      prev.map(m => 
                        m.id === updatedMessage.id 
                          ? { 
                              ...m, 
                              content, 
                              is_edited: updatedMessage.is_edited,
                              edited_at: updatedMessage.edited_at,
                              is_deleted: updatedMessage.is_deleted,
                              deleted_at: updatedMessage.deleted_at
                            } 
                          : m
                      )
                    );
                  }).catch(error => {
                    console.error("Error decrypting updated message:", error);
                  });
                  // Return as is for now, will be updated in the next render
                  return msg;
                } else {
                  // If only metadata was updated (e.g., is_deleted flag)
                  return { 
                    ...msg, 
                    is_edited: updatedMessage.is_edited,
                    edited_at: updatedMessage.edited_at,
                    is_deleted: updatedMessage.is_deleted,
                    deleted_at: updatedMessage.deleted_at
                  };
                }
              }
              return msg;
            })
          );
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setMessages, receiverId, groupId]);

  return { setupRealtimeSubscription };
};
