
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserPresence, UserStatus } from '@/types/presence';
import { useToast } from '@/components/ui/use-toast';

interface ChatPresenceProps {
  userId: string | null;
  setUserPresence: (updater: React.SetStateAction<Record<string, UserPresence>>) => void;
  currentStatus: UserStatus;
  hidden: boolean;
}

export const ChatPresence = ({
  userId,
  setUserPresence,
  currentStatus,
  hidden
}: ChatPresenceProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const setupPresence = async () => {
      // Hvis brukeren er skjult, ikke oppdater presence
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
        // Slett brukerens presence hvis de vil være skjult
        const { error: deleteError } = await supabase
          .from('user_presence')
          .delete()
          .eq('user_id', userId);
          
        if (deleteError && deleteError.code !== 'PGRST116') { // Ignore not found error
          console.error("Error deleting presence:", deleteError);
        }
      }

      // Sett opp lytting på presence-endringer
      const channel = supabase
        .channel('presence-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_presence'
          }, 
          async () => {
            // Når vi oppdager endringer, hent alle presence-data på nytt
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

      // Hent presence-data umiddelbart ved oppstart
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

  return null;
};
