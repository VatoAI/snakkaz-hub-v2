
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageP2P = (
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  const addP2PMessage = useCallback((message: string, peerId: string) => {
    // Check if the message has a [Privat] prefix, which indicates it's end-to-end encrypted
    const isPrivate = message.startsWith('[Privat] ');
    const messageContent = isPrivate ? message.substring(9) : message;
    
    console.log(`Adding ${isPrivate ? 'private' : 'regular'} P2P message from ${peerId}`);
    
    const p2pMessage: DecryptedMessage = {
      id: `p2p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Make ID more unique
      content: messageContent,
      created_at: new Date().toISOString(),
      encryption_key: '',
      iv: '',
      sender: {
        id: peerId, // Use peerId as sender id
        username: peerId,
        full_name: null,
        avatar_url: null
      },
      receiver_id: null, // This is a direct message, but receiver_id isn't set here
      is_encrypted: isPrivate // Mark whether the message was end-to-end encrypted
    };
    
    setMessages(prev => [...prev, p2pMessage]);
    return p2pMessage.id; // Return ID in case we need to reference the message later
  }, [setMessages]);

  return { addP2PMessage };
};
