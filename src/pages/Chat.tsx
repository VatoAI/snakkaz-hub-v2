
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
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  
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

  // Hent venner når userId endres
  useEffect(() => {
    if (!userId) return;
    
    const fetchFriends = async () => {
      try {
        const { data, error } = await supabase
          .from('friendships')
          .select('friend_id, user_id')
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted');
          
        if (error) throw error;
        
        const friendIds = (data || []).map(f => 
          f.user_id === userId ? f.friend_id : f.user_id
        );
        
        setFriendsList(friendIds);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    
    fetchFriends();
    
    // Sett opp subscription for vennskap
    const friendsChannel = supabase
      .channel('friendships-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          or: [`user_id.eq.${userId}`, `friend_id.eq.${userId}`]
        }, 
        () => {
          fetchFriends();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [userId]);

  // Set up real-time presence
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
  }, [userId, currentStatus, hidden]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!userId || hidden) return;

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

  const handleToggleHidden = async () => {
    setHidden(!hidden);
    
    // Oppdateringen av presence skjer i useEffect-hooken
  };

  const handleSendFriendRequest = async (friendId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Forespørsel eksisterer",
            description: "Du har allerede sendt eller mottatt en venneforespørsel fra denne brukeren",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Forespørsel sendt",
          description: "Venneforespørsel sendt!",
        });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende venneforespørsel",
        variant: "destructive",
      });
    }
  };

  const handleStartChat = (friendId: string) => {
    // Simulere klikk på venneikon i sidepanelet
    // Dette vil vanligvis åpne venner-dialogen
    document.dispatchEvent(new CustomEvent('start-chat-with-friend', { 
      detail: { friendId }
    }));
    
    toast({
      title: "Åpner chat",
      description: "Åpner chat med bruker",
    });
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
        friends={friendsList}
        onSendFriendRequest={handleSendFriendRequest}
        onStartChat={handleStartChat}
        hidden={hidden}
        onToggleHidden={handleToggleHidden}
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
