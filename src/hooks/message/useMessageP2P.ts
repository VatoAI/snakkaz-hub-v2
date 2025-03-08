
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageP2P = (
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  // This function is now just a placeholder since we're not using P2P messaging anymore
  const addP2PMessage = useCallback(() => {
    console.log('P2P messaging has been disabled. Using server-only messaging.');
    return '';
  }, []);

  return { addP2PMessage };
};
