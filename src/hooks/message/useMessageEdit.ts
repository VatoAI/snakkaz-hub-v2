import { useCallback } from "react";
import { SupabaseService } from "@/services/supabase.service";
import { encryptMessage } from "@/utils/encryption";

export const useMessageEdit = (
  userId: string | null,
  setIsLoading: (loading: boolean) => void,
  toast: any
) => {
  const supabase = SupabaseService.getInstance();

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!userId) {
      console.log("Bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      const { encryptedContent, key, iv } = await encryptMessage(newContent.trim());

      await supabase.editMessage({
        messageId,
        senderId: userId,
        encryptedContent,
        encryptionKey: key,
        iv
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Feil ved redigering av melding",
        description: "Kunne ikke redigere meldingen. Prøv igjen senere.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [userId, setIsLoading, toast, supabase]);

  return { handleEditMessage };
}; 