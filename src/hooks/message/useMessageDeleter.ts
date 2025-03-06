
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureMessageColumnsExist } from "./utils/message-db-utils";

export const useMessageDeleter = (
  userId: string | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      // Ensure necessary columns exist
      await ensureMessageColumnsExist();
      
      console.log(`Attempting to delete message ${messageId} for user ${userId}`);
      
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId); // Ensure only sender can delete

      if (error) {
        console.error('Delete message error:', error);
        throw error;
      }
      
      console.log('Delete message result:', data);
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error; // Re-throw to handle in the calling function
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast]);

  return { handleDeleteMessage };
};
