
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DecryptedMessage } from "@/types/message";

export const useMessageExpiry = (
  setMessages: (updater: (prev: DecryptedMessage[]) => DecryptedMessage[]) => void
) => {
  const handleMessageExpired = useCallback(async (messageId: string) => {
    console.log("Message expired:", messageId);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error("Error deleting expired message:", error);
        return;
      }

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error("Error handling message expiration:", error);
    }
  }, [setMessages]);

  return { handleMessageExpired };
};
