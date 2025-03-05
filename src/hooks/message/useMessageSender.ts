
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptMessage } from "@/utils/encryption";
import { ensureMessageColumnsExist, showUploadToast, uploadMediaFile } from "./utils/message-db-utils";

export const useMessageSender = (
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
      // Ensure necessary columns exist
      await ensureMessageColumnsExist();

      let mediaUrl = null;
      let mediaType = null;

      // Handle media file upload if present
      if (mediaFile) {
        toastId = showUploadToast(toast, 'uploading');
        
        try {
          const mediaData = await uploadMediaFile(mediaFile);
          mediaUrl = mediaData.mediaUrl;
          mediaType = mediaData.mediaType;
          
          // Update toast on success
          showUploadToast(toast, 'success', "Sender melding med vedlegg...");
        } catch (uploadError) {
          throw uploadError;
        }
      }

      // Count of successfully delivered P2P messages
      let p2pDeliveryCount = 0;
      
      // Try to send message via P2P if no specific receiver and webRTCManager is available
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
      
      // Set default 24-hour TTL for normal messages
      const defaultTtl = 86400; // 24 hours in seconds
      const messageTtl = ttl || defaultTtl;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          ephemeral_ttl: messageTtl,
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

  return { handleSendMessage };
};
