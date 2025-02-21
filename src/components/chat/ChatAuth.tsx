
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ChatAuthProps {
  setUserId: (id: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  initializeWebRTC: (userId: string) => any;
  setupPresenceChannel: (userId: string) => () => void;
}

export const useChatAuth = ({
  setUserId,
  setAuthLoading,
  initializeWebRTC,
  setupPresenceChannel,
}: ChatAuthProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isSubscribed) return;

        if (error) {
          console.error("Auth error:", error);
          toast({
            title: "Autentiseringsfeil",
            description: error.message,
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        if (!session) {
          console.log("No session found, redirecting to login");
          navigate('/login');
          return;
        }

        try {
          const { error: connectionError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

          if (!isSubscribed) return;

          if (connectionError) {
            console.error("Connection error:", connectionError);
            toast({
              title: "Tilkoblingsfeil",
              description: "Kunne ikke koble til serveren. Sjekk internettforbindelsen din.",
              variant: "destructive",
            });
            return;
          }

          console.log("Session found:", session);
          setUserId(session.user.id);
          setAuthLoading(false);
          
          const rtcManager = initializeWebRTC(session.user.id);
          if (rtcManager) {
            const cleanup = setupPresenceChannel(session.user.id);
            return () => {
              cleanup();
            };
          }
        } catch (error) {
          if (!isSubscribed) return;
          console.error("Connection check error:", error);
          toast({
            title: "Tilkoblingsfeil",
            description: "Kunne ikke verifisere tilkoblingen til serveren.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isSubscribed) return;
        console.error("Unexpected auth error:", error);
        toast({
          title: "Uventet feil",
          description: "Det oppstod en feil ved innlogging. Prøv å laste siden på nytt.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;
      console.log("Auth state changed:", event, session);
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session) {
        setUserId(session.user.id);
        setAuthLoading(false);
      }
    });

    checkAuth();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, initializeWebRTC, setupPresenceChannel, setUserId, setAuthLoading, toast]);
};
