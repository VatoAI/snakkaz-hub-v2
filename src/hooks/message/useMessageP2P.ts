
import { useCallback } from "react";
import { DecryptedMessage } from "@/types/message";

export const useMessageP2P = (
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  const addP2PMessage = useCallback((message: string, peerId: string) => {
    console.log('Legacy P2P message functionality - not used anymore');
    return '';
  }, [setMessages]);

  return { addP2PMessage };
};
