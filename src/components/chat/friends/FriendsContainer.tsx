
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FriendSearch } from "./FriendSearch";
import { FriendRequests } from "./FriendRequests";
import { FriendsList } from "./FriendsList";
import { Friend, UserProfile } from "./types";

interface FriendsContainerProps {
  currentUserId: string;
}

export const FriendsContainer = ({ currentUserId }: FriendsContainerProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
    const cleanup = setupFriendsSubscription();
    return () => {
      cleanup();
    };
  }, [currentUserId]);

  const fetchFriends = async () => {
    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          *,
          profile:profiles!friendships_friend_id_fkey (
            username,
            full_name
          )
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (error) throw error;

      if (friendships) {
        const processedFriends = friendships.map(friendship => ({
          ...friendship,
          profile: friendship.profile || null
        })) as Friend[];

        setFriends(processedFriends.filter(f => f.status === 'accepted'));
        setFriendRequests(processedFriends.filter(f => f.status === 'pending'));
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente venner",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (username: string) => {
    if (username.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .neq('id', currentUserId)
        .ilike('username', `%${username}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke søke etter brukere",
        variant: "destructive",
      });
    }
  };

  const setupFriendsSubscription = () => {
    const channel = supabase
      .channel('friends-changes')
      .on(
        'postgres_changes',
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Venneforespørsel sendt",
      });
      setSearchUsername("");
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende venneforespørsel",
        variant: "destructive",
      });
    }
  };

  const handleFriendRequest = async (friendshipId: string, accept: boolean) => {
    try {
      if (accept) {
        await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);
        
        toast({
          title: "Suksess",
          description: "Venneforespørsel akseptert",
        });
      } else {
        await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);
        
        toast({
          title: "Info",
          description: "Venneforespørsel avslått",
        });
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke håndtere venneforespørsel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <FriendSearch
        searchUsername={searchUsername}
        onSearchChange={(value) => {
          setSearchUsername(value);
          searchUsers(value);
        }}
        searchResults={searchResults}
        onSendRequest={handleSendFriendRequest}
      />
      <FriendRequests
        requests={friendRequests}
        onHandleRequest={handleFriendRequest}
      />
      <FriendsList friends={friends} />
    </div>
  );
};
