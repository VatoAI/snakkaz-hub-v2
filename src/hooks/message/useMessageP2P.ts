
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageP2P = (
  setMessages: (updater: React.SetStateAction<DecryptedMessage[]>) => void
) => {
  const addP2PMessage = useCallback((message: DecryptedMessage) => {
    setMessages(prevMessages => {
      // Check if message already exists (prevent duplicates)
      if (prevMessages.some(msg => msg.id === message.id)) {
        return prevMessages;
      }
      
      return [...prevMessages, message];
    });
  }, [setMessages]);

  return { addP2PMessage };
};
