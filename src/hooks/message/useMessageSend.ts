import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptMessage } from "@/utils/encryption";

export const useMessageSend = (
  userId: string | null,
  newMessage: string,
  setNewMessage: (message: string) => void,
  ttl: number | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  const handleSendMessage = useCallback(async (webRTCManager: any, onlineUsers: Set<string>, mediaFile?: File, receiverId?: string, groupId?: string) => {
    if ((!newMessage.trim() && !mediaFile) || !userId) {
      console.log("Ingen melding eller fil å sende, eller bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    let toastId = null;
    
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

      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        // Show uploading toast
        toastId = toast({
          title: "Laster opp fil...",
          description: "Vennligst vent mens filen lastes opp",
        }).id;
        
        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        mediaUrl = filePath;
        mediaType = mediaFile.type;
        
        // Update toast on success
        toast({
          id: toastId,
          title: "Fil lastet opp",
          description: "Sender melding med vedlegg...",
        });
      }

      // Count of successfully delivered P2P messages
      let p2pDeliveryCount = 0;
      
      if (webRTCManager && !receiverId && !groupId) {
        const peerPromises: Promise<boolean>[] = [];
        const peerErrors: Record<string, string> = {};
        
        // Try to send message to each online user with a 10 second timeout
        for (const peerId of onlineUsers) {
          if (peerId !== userId) {
            const timeoutPromise = new Promise<boolean>((resolve) => {
              setTimeout(() => resolve(false), 10000);
            });
            
            const sendPromise = new Promise<boolean>(async (resolve) => {
              try {
                // Check if peer is ready
                const isReady = await webRTCManager.ensurePeerReady(peerId);
                
                if (isReady) {
                  await webRTCManager.sendMessage(peerId, newMessage.trim());
                  resolve(true);
                } else {
                  peerErrors[peerId] = 'Peer not ready';
                  resolve(false);
                }
              } catch (error) {
                console.error(`Error sending message to peer ${peerId}:`, error);
                peerErrors[peerId] = error instanceof Error ? error.message : 'Unknown error';
                resolve(false);
              }
            });
            
            peerPromises.push(Promise.race([sendPromise, timeoutPromise]));
          }
        }
        
        // Wait for all peer send attempts to complete
        const results = await Promise.all(peerPromises);
        p2pDeliveryCount = results.filter(result => result).length;
        
        if (p2pDeliveryCount === 0 && onlineUsers.size > 1) {
          console.warn('Failed to deliver message to any peers:', peerErrors);
        }
      }

      // Always store in database for history and offline users
      const { encryptedContent, key, iv } = await encryptMessage(newMessage.trim());
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          ephemeral_ttl: ttl,
          media_url: mediaUrl,
          media_type: mediaType,
          receiver_id: receiverId,
          group_id: groupId ? true : null,
          is_edited: false,
          is_deleted: false
        });

      if (error) {
        console.error('Send message error:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke sende melding: " + error.message,
          variant: "destructive",
        });
      } else {
        console.log("Melding sendt vellykket");
        
        // If we were showing a toast for file upload, update it
        if (toastId) {
          toast({
            id: toastId,
            title: "Melding sendt",
            description: mediaFile ? "Melding med vedlegg ble sendt" : "Melding ble sendt",
          });
        }
        
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update existing toast or create new one
      if (toastId) {
        toast({
          id: toastId,
          title: "Feil",
          description: "Kunne ikke sende melding: " + (error instanceof Error ? error.message : 'Ukjent feil'),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Feil",
          description: "Kunne ikke sende melding",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [newMessage, userId, ttl, setNewMessage, setIsLoading, toast]);

  const handleEditMessage = useCallback(async (
    messageId: string,
    content: string,
  ) => {
    if (!content.trim() || !userId) {
      console.log("Ingen melding å redigere, eller bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
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

      const { encryptedContent, key, iv } = await encryptMessage(content.trim());
      
      const { error } = await supabase
        .from('messages')
        .update({
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId); // Sikre at kun avsender kan redigere

      if (error) {
        console.error('Edit message error:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke redigere melding: " + error.message,
          variant: "destructive",
        });
      } else {
        console.log("Melding redigert");
        setNewMessage("");
        toast({
          title: "Redigert",
          description: "Meldingen ble redigert",
        });
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke redigere melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setNewMessage, setIsLoading, toast]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
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
      
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId); // Sikre at kun avsender kan slette

      if (error) {
        console.error('Delete message error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast]);

  return { 
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage
  };
};
