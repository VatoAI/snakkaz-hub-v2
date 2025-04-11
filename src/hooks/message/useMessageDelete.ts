import { useCallback } from "react";
import { SupabaseService } from "@/services/supabase.service";

export const useMessageDelete = (
  userId: string | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  const supabase = SupabaseService.getInstance();

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      await supabase.deleteMessage({
        messageId,
        senderId: userId
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Feil ved sletting av melding",
        description: "Kunne ikke slette meldingen. Prøv igjen senere.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast, supabase]);

  return { handleDeleteMessage };
}; 