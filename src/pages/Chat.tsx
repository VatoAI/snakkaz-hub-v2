
import { useEffect, useState } from 'react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { useMessages } from '@/hooks/useMessages';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from "@/integrations/supabase/client";
import { UserPresence, UserStatus } from '@/types/presence';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useChatAuth } from '@/components/chat/ChatAuth';
import { useToast } from "@/components/ui/use-toast";
import { DecryptedMessage } from '@/types/message';
import { useMessageP2P } from '@/hooks/message/useMessageP2P';

const Chat = () => {
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('online');
  const [directMessages, setDirectMessages] = useState<DecryptedMessage[]>([]);
  
  const { addP2PMessage } = useMessageP2P(setDirectMessages);
  
  const { webRTCManager, setupPresenceChannel, initializeWebRTC } = useWebRTC(userId, (message: string, peerId: string) => {
    addP2PMessage(message, peerId);
  });

  useChatAuth({
    setUserId,
    setAuthLoading,
    initializeWebRTC,
    setupPresenceChannel
  });

  const { 
    messages, 
    newMessage, 
    setNewMessage, 
    isLoading, 
    ttl, 
    setTtl, 
    fetchMessages, 
    setupRealtimeSubscription,
    handleSendMessage,
    handleMessageExpired
  } = useMessages(userId);

  // Set up real-time presence
  useEffect(() => {
    if (!userId) return;

    const setupPresence = async () => {
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

      const channel = supabase
        .channel('public:user_presence')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence'
          },
          async (payload) => {
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

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupPresence();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [userId, currentStatus]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!userId) return;

    setCurrentStatus(newStatus);
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
  };

  const handleDirectMessage = (message: DecryptedMessage) => {
    setDirectMessages(prev => [...prev, message]);
  };

  useEffect(() => {
    if (userId) {
      console.log("Setting up messages for user:", userId);
      fetchMessages();
      return setupRealtimeSubscription();
    }
  }, [userId, fetchMessages, setupRealtimeSubscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (webRTCManager && userId) {
      await handleSendMessage(webRTCManager, new Set(Object.keys(userPresence)));
    } else {
      toast({
        title: "WebRTC ikke initialisert",
        description: "Prøv å laste siden på nytt",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cyberdark-900">
        <div className="animate-pulse text-cybergold-200">Laster...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-cyberdark-900 max-w-full overflow-hidden">
      <ChatHeader
        userPresence={userPresence}
        currentUserId={userId}
        currentStatus={currentStatus}
        onStatusChange={handleStatusChange}
        webRTCManager={webRTCManager}
        directMessages={directMessages}
        onNewMessage={handleDirectMessage}
      />
      
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          onMessageExpired={handleMessageExpired}
        />
      </div>

      <div className="p-2 sm:p-4 border-t border-cybergold-500/30">
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
