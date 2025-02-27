import { useEffect, useState, useRef } from 'react';
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
import { Friend } from '@/components/chat/friends/types';
import { DirectMessage } from '@/components/chat/friends/DirectMessage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Chat = () => {
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('online');
  const [directMessages, setDirectMessages] = useState<DecryptedMessage[]>([]);
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, {username: string | null, avatar_url: string | null}>>({});
  
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

  // Last inn brukerprofiler
  useEffect(() => {
    const loadUserProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url');
          
        if (error) throw error;
        
        const profileMap: Record<string, {username: string | null, avatar_url: string | null}> = {};
        data?.forEach(profile => {
          profileMap[profile.id] = {
            username: profile.username,
            avatar_url: profile.avatar_url
          };
        });
        
        setUserProfiles(profileMap);
      } catch (error) {
        console.error('Error loading user profiles:', error);
      }
    };
    
    loadUserProfiles();
    
    // Lytt etter brukernavn oppdateringer
    const handleUsernameUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { userId, username } = customEvent.detail;
        setUserProfiles(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            username
          }
        }));
      }
    };
    
    // Lytt etter avatar oppdateringer
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { userId, avatarUrl } = customEvent.detail;
        setUserProfiles(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            avatar_url: avatarUrl
          }
        }));
      }
    };
    
    document.addEventListener('username-updated', handleUsernameUpdate);
    document.addEventListener('avatar-updated', handleAvatarUpdate);
    
    // Sett opp subscription for profil-endringer
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles'
        }, 
        async (payload) => {
          if (payload.new) {
            const newProfile = payload.new as any;
            setUserProfiles(prev => ({
              ...prev,
              [newProfile.id]: {
                username: newProfile.username,
                avatar_url: newProfile.avatar_url
              }
            }));
          }
        }
      )
      .subscribe();
    
    return () => {
      document.removeEventListener('username-updated', handleUsernameUpdate);
      document.removeEventListener('avatar-updated', handleAvatarUpdate);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  // Hent venner når userId endres
  useEffect(() => {
    if (!userId) return;
    
    const fetchFriends = async () => {
      try {
        const { data: friendships, error: friendshipsError } = await supabase
          .from('friendships')
          .select(`
            id,
            user_id,
            friend_id,
            status,
            profiles!friendships_friend_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq('status', 'accepted');
          
        if (friendshipsError) throw friendshipsError;
        
        const friendIds = (friendships || []).map(f => 
          f.user_id === userId ? f.friend_id : f.user_id
        );
        
        setFriendsList(friendIds);
        setFriends(friendships || []);

        // Hvis vi har en aktiv chat med en venn, oppdater den
        if (activeChat && !friendIds.includes(activeChat)) {
          setActiveChat(null);
          setSelectedFriend(null);
        }
        
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
          filter: `user_id=eq.${userId}` 
        }, 
        () => {
          fetchFriends();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `friend_id=eq.${userId}` 
        }, 
        () => {
          fetchFriends();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [userId, activeChat]);

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
    // Finn vennen i vennelisten
    const friend = friends.find(f => 
      (f.user_id === userId && f.friend_id === friendId) || 
      (f.friend_id === userId && f.user_id === friendId)
    );
    
    if (friend) {
      setActiveChat(friendId);
      setSelectedFriend(friend);
    } else {
      toast({
        title: "Finner ikke venn",
        description: "Kunne ikke finne vennskap med denne brukeren",
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
  
  const handleCloseDirectChat = () => {
    setActiveChat(null);
    setSelectedFriend(null);
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
        userProfiles={userProfiles}
      />
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="global" className="w-full h-full">
          <div className="border-b border-cybergold-500/30 px-4">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="global" className="text-cybergold-300 data-[state=active]:text-cybergold-100 data-[state=active]:border-b-2 data-[state=active]:border-cybergold-400 rounded-none">
                Global Chat
              </TabsTrigger>
              {selectedFriend && (
                <TabsTrigger value="direct" className="text-cybergold-300 data-[state=active]:text-cybergold-100 data-[state=active]:border-b-2 data-[state=active]:border-cybergold-400 rounded-none">
                  {selectedFriend.profiles?.username || 'Direktemelding'}
                  <button 
                    onClick={handleCloseDirectChat}
                    className="ml-2 text-xs text-cybergold-400 hover:text-cybergold-300"
                  >
                    ✕
                  </button>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="global" className="h-full flex flex-col mt-0 pt-0">
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
          </TabsContent>
          
          {selectedFriend && (
            <TabsContent value="direct" className="h-full mt-0 pt-0">
              <div className="h-full">
                <DirectMessage 
                  friend={selectedFriend}
                  currentUserId={userId || ''}
                  webRTCManager={webRTCManager}
                  onBack={handleCloseDirectChat}
                  messages={directMessages}
                  onNewMessage={handleDirectMessage}
                  userProfiles={userProfiles}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Chat;
