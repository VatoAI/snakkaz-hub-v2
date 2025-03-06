
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureMessageColumnsExist } from "./utils/message-db-utils";
import { useToast } from "@/components/ui/use-toast";

export const useMessageDeleter = (
  userId: string | null,
  setIsLoading: (loading: boolean) => void,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  const handleDeleteMessage = useCallback(async (messageId: string): Promise<void> => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      // Ensure necessary columns exist
      await ensureMessageColumnsExist();
      
      console.log(`Attempting to delete message ${messageId} for user ${userId}`);
      
      // Call Supabase RPC function to mark message as deleted
      const { error } = await supabase
        .rpc('mark_message_as_deleted', { 
          message_id: messageId, 
          user_id: userId 
        });

      if (error) {
        console.error('Delete message error:', error);
        toast({
          title: "Feil ved sletting",
          description: "Kunne ikke slette meldingen: " + error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Message successfully marked as deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette meldingen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast]);

  return { handleDeleteMessage };
};
