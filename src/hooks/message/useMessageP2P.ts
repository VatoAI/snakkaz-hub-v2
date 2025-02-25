
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageP2P = (
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  const addP2PMessage = useCallback((message: string, peerId: string) => {
    const p2pMessage: DecryptedMessage = {
      id: `p2p-${Date.now()}`,
      content: message,
      created_at: new Date().toISOString(),
      encryption_key: '',
      iv: '',
      sender: {
        id: peerId, // Bruker peerId som sender id
        username: peerId,
        full_name: null,
        avatar_url: null
      }
    };
    setMessages(prev => [...prev, p2pMessage]);
  }, [setMessages]);

  return { addP2PMessage };
};
