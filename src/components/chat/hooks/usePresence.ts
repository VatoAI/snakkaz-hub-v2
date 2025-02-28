
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserStatus } from '@/types/presence';
import { useToast } from "@/components/ui/use-toast";

export const usePresence = (
  userId: string | null, 
  currentStatus: UserStatus,
  setUserPresence: (presence: any) => void,
  hidden: boolean
) => {
  const { toast } = useToast();

  // Set up real-time presence
  useEffect(() => {
    if (!userId) return;

    const setupPresence = async () => {
      // If user is hidden, don't update presence
      if (!hidden) {
        const { error: upsertError } = await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            status: currentStatus,
            last_seen: new Date().toISOString()
          });

        if (upsertError) {
          console.error("Error setting initial presence:", upsertError);
        }
      } else {
        // Delete user's presence if they want to be hidden
        const { error: deleteError } = await supabase
          .from('user_presence')
          .delete()
          .eq('user_id', userId);
          
        if (deleteError && deleteError.code !== 'PGRST116') { // Ignore not found error
          console.error("Error deleting presence:", deleteError);
        }
      }

      // Set up listening for presence changes
      const channel = supabase
        .channel('presence-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_presence'
          }, 
          async () => {
            // When we detect changes, fetch all presence data again
            const { data: presenceData, error } = await supabase
              .from('user_presence')
              .select('*');

            if (error) {
              console.error("Error fetching presence data:", error);
              return;
            }

            if (presenceData) {
              const presenceMap = presenceData.reduce((acc, presence) => ({
                ...acc,
                [presence.user_id]: presence
              }), {});
              setUserPresence(presenceMap);
            }
          }
        )
        .subscribe();

      // Fetch presence data immediately at startup
      const { data: initialPresenceData, error: initialError } = await supabase
        .from('user_presence')
        .select('*');
        
      if (initialError) {
        console.error("Error fetching initial presence data:", initialError);
      } else if (initialPresenceData) {
        const presenceMap = initialPresenceData.reduce((acc, presence) => ({
          ...acc,
          [presence.user_id]: presence
        }), {});
        setUserPresence(presenceMap);
      }

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupPresence();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [userId, currentStatus, hidden, setUserPresence]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!userId || hidden) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status: newStatus,
          last_seen: new Date().toISOString()
        });

      if (error) {
        console.error("Error updating status:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke oppdatere status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere status",
        variant: "destructive",
      });
    }
  };

  return { handleStatusChange };
};
