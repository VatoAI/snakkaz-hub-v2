
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
      
      const { error } = await supabase
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
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast]);

  return { handleDeleteMessage };
};
