import { useEffect, useState } from 'react';
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
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  // Set up real-time presence
  useEffect(() => {
    if (!userId) return;

    const setupPresence = async () => {
      // First, remove any existing presence for this user
      const cleanupExisting = async () => {
        try {
          const { error: deleteError } = await supabase
            .from('user_presence')
            .delete()
            .eq('user_id', userId);
            
          if (deleteError && deleteError.code !== 'PGRST116') { // Ignore not found error
            console.error("Error cleaning up existing presence:", deleteError);
          }
        } catch (error) {
          console.error("Failed to clean up existing presence:", error);
        }
      };

      await cleanupExisting();
      
      // If user is not hidden, create/update their presence
      if (!hidden) {
        try {
          const { error: upsertError } = await supabase
            .from('user_presence')
            .upsert({
              user_id: userId,
              status: currentStatus,
              last_seen: new Date().toISOString()
            });

          if (upsertError) {
            console.error("Error setting initial presence:", upsertError);
            toast({
              title: "Feil ved oppdatering av status",
              description: "Kunne ikke sette initial tilstedeværelse",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error in presence setup:", error);
        }
      }

      // Set up channel for presence updates
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
            try {
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
            } catch (error) {
              console.error("Error handling presence update:", error);
            }
          }
        )
        .subscribe((status) => {
          console.log("Presence channel status:", status);
        });

      setPresenceChannel(channel);

      // Fetch initial presence data
      try {
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
      } catch (error) {
        console.error("Error getting initial presence:", error);
      }

      // Set up heartbeat to keep presence fresh
      const heartbeatInterval = setInterval(async () => {
        if (hidden) return;
        
        try {
          const { error } = await supabase
            .from('user_presence')
            .upsert({
              user_id: userId,
              status: currentStatus,
              last_seen: new Date().toISOString()
            });

          if (error) {
            console.error("Heartbeat error:", error);
          }
        } catch (error) {
          console.error("Error in heartbeat:", error);
        }
      }, 30000); // Update every 30 seconds

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
        clearInterval(heartbeatInterval);
      };
    };

    const cleanup = setupPresence();
    
    return () => {
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
      
      // Clear user's presence when component unmounts
      if (!hidden && userId) {
        supabase
          .from('user_presence')
          .delete()
          .eq('user_id', userId)
          .then(({ error }) => {
            if (error) {
              console.error("Error cleaning up presence on unmount:", error);
            }
          });
      }
    };
  }, [userId, hidden, setUserPresence, toast]);

  // Handle status changes separately - watch for currentStatus changes
  useEffect(() => {
    if (!userId || hidden) return;

    const updateStatus = async () => {
      try {
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            status: currentStatus,
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
        console.error("Error in status update:", error);
      }
    };

    updateStatus();
  }, [userId, currentStatus, hidden, toast]);

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
