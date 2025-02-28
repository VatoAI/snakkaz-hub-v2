
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageP2P = (
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  const addP2PMessage = useCallback((message: string, peerId: string) => {
    // Sjekk om meldingen har en [Privat] prefiks, som indikerer at den er ende-til-ende-kryptert
    const isPrivate = message.startsWith('[Privat] ');
    const messageContent = isPrivate ? message.substring(9) : message;
    
    console.log(`Adding ${isPrivate ? 'private' : 'regular'} P2P message from ${peerId}`);
    
    const p2pMessage: DecryptedMessage = {
      id: `p2p-${Date.now()}`,
      content: messageContent,
      created_at: new Date().toISOString(),
      encryption_key: '',
      iv: '',
      sender: {
        id: peerId, // Bruker peerId som sender id
        username: peerId,
        full_name: null,
        avatar_url: null
      },
      receiver_id: null, // Dette er en direktemelding, men mottakerid settes ikke her
      is_encrypted: isPrivate // Markerer om meldingen var ende-til-ende-kryptert
    };
    
    setMessages(prev => [...prev, p2pMessage]);
    return p2pMessage.id; // Returner ID i tilfelle vi trenger å referere til meldingen senere
  }, [setMessages]);

  return { addP2PMessage };
};
