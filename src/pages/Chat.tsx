
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from "@/components/ui/use-toast";
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from "@/integrations/supabase/client";

const Chat = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { webRTCManager, setupPresenceChannel, initializeWebRTC } = useWebRTC(userId, (message: string, peerId: string) => {
    addP2PMessage(message, peerId);
  });

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

        // Check connection by trying to access the profiles table
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
          console.log("Access token:", session.access_token);
          
          setUserId(session.user.id);
          setAuthLoading(false);
          
          // Initialize WebRTC after we have the user ID
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
  }, [navigate, initializeWebRTC, setupPresenceChannel, toast]);

  const { 
    messages, 
    newMessage, 
    setNewMessage, 
    isLoading, 
    ttl, 
    setTtl, 
    fetchMessages, 
    setupRealtimeSubscription,
    addP2PMessage, 
    handleSendMessage,
    handleMessageExpired
  } = useMessages(userId);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (userId) {
      console.log("Setting up messages for user:", userId);
      fetchMessages();
      unsubscribe = setupRealtimeSubscription();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, fetchMessages, setupRealtimeSubscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (webRTCManager && userId) {
      await handleSendMessage(webRTCManager, onlineUsers);
    } else {
      toast({
        title: "WebRTC ikke initialisert",
        description: "Prøv å laste siden på nytt",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-cyberdark-900">
      <div className="p-4 border-b border-cybergold-500/30 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cybergold-200">CyberChat 2077</h1>
        <div className="text-cybergold-200">
          {Array.from(onlineUsers).length} online
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          onMessageExpired={handleMessageExpired}
        />
      </div>

      <div className="p-4 border-t border-cybergold-500/30">
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          ttl={ttl}
          setTtl={setTtl}
        />
      </div>
    </div>
  );
};

export default Chat;
