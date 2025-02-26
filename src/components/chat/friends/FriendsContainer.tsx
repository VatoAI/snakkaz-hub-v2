
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FriendSearch } from "./FriendSearch";
import { FriendRequests } from "./FriendRequests";
import { FriendsList } from "./FriendsList";
import { Friend, UserProfile } from "./types";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";

interface FriendsContainerProps {
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  directMessages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
  onStartChat?: (userId: string) => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

export const FriendsContainer = ({ 
  currentUserId,
  webRTCManager,
  directMessages,
  onNewMessage,
  onStartChat,
  userProfiles = {}
}: FriendsContainerProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
      const cleanup = setupFriendsSubscription();
      return () => {
        cleanup();
      };
    }
  }, [currentUserId]);

  const fetchFriends = async () => {
    try {
      console.log('Fetching friends for user:', currentUserId);
      
      // Først henter vi vennskap hvor brukeren er enten user_id eller friend_id
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          friend_id,
          user_id,
          profiles!friendships_friend_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (friendshipsError) {
        console.error('Error fetching friendships:', friendshipsError);
        throw friendshipsError;
      }

      if (!friendships?.length) {
        console.log('No friendships found');
        setFriends([]);
        setFriendRequests([]);
        return;
      }

      console.log('Found friendships:', friendships);

      // Kombinerer vennskap og profiler
      const processedFriends = friendships.map(friendship => {
        return {
          ...friendship
        };
      });

      console.log('Processed friends:', processedFriends);

      setFriends(processedFriends.filter(f => f.status === 'accepted'));
      setFriendRequests(processedFriends.filter(f => 
        f.status === 'pending' && f.friend_id === currentUserId
      ));

    } catch (error) {
      console.error('Error in fetchFriends:', error);
      toast({
        title: "Feil ved henting av venner",
        description: "Kunne ikke hente vennelisten din",
        variant: "destructive",
      });
    }
  };

  const setupFriendsSubscription = () => {
    const friendsSubscription = supabase
      .channel('friendships-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `user_id=eq.${currentUserId}` 
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
          filter: `friend_id=eq.${currentUserId}` 
        }, 
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendsSubscription);
    };
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .ilike('username', `%${searchUsername}%`)
        .limit(5);

      if (error) {
        throw error;
      }

      const filteredResults = data?.filter(profile => profile.id !== currentUserId) || [];
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Søkefeil",
        description: "Kunne ikke søke etter brukere",
        variant: "destructive",
      });
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: userId,
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
        setSearchResults([]);
        setSearchUsername('');
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

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) {
        throw error;
      }

      toast({
        title: "Venneforespørsel godkjent",
        description: "Dere er nå venner!",
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke godkjenne venneforespørsel",
        variant: "destructive",
      });
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        throw error;
      }

      toast({
        title: "Venneforespørsel avslått",
        description: "Forespørselen ble avslått",
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke avslå venneforespørsel",
        variant: "destructive",
      });
    }
  };

  const handleStartDirectChat = (friendId: string) => {
    if (onStartChat) {
      onStartChat(friendId);
    }
  };

  return (
    <div className="space-y-4">
      <FriendSearch 
        searchUsername={searchUsername}
        setSearchUsername={setSearchUsername}
        onSearch={handleSearch}
        searchResults={searchResults}
        onSendFriendRequest={handleSendFriendRequest}
      />
      
      {friendRequests.length > 0 && (
        <FriendRequests 
          friendRequests={friendRequests}
          onAccept={handleAcceptFriendRequest}
          onReject={handleRejectFriendRequest}
          userProfiles={userProfiles}
        />
      )}
      
      <FriendsList 
        friends={friends} 
        currentUserId={currentUserId}
        webRTCManager={webRTCManager}
        directMessages={directMessages}
        onNewMessage={onNewMessage}
        onStartChat={handleStartDirectChat}
        userProfiles={userProfiles}
      />
    </div>
  );
};
