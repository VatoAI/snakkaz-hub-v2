
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageExpiry = (
  setMessages: (updater: React.SetStateAction<DecryptedMessage[]>) => void
) => {
  const handleMessageExpired = useCallback((messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
  }, [setMessages]);

  return { handleMessageExpired };
};
