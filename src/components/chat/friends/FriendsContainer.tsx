
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
          user_id
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

      // Henter profiler for alle involverte brukere
      const friendIds = friendships.map(f => 
        f.user_id === currentUserId ? f.friend_id : f.user_id
      );

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Found profiles:', profiles);

      // Kombinerer vennskap og profiler
      const processedFriends = friendships.map(friendship => {
        const friendId = friendship.user_id === currentUserId 
          ? friendship.friend_id 
          : friendship.user_id;
        
        const profile = profiles?.find(p => p.id === friendId);
        
        return {
          ...friendship,
          profile: profile || null
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
        title: "Feil",
        description: "Kunne ikke hente venner. Prøv igjen senere.",
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (username: string) => {
    try {
      if (username.length < 3) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .neq('id', currentUserId)
        .ilike('username', `%${username}%`)
        .limit(5);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }

      // Filtrer bort eksisterende venner og venneforespørsler
      const existingFriendIds = new Set([
        ...friends.map(f => f.user_id === currentUserId ? f.friend_id : f.user_id),
        ...friendRequests.map(f => f.user_id === currentUserId ? f.friend_id : f.user_id)
      ]);

      const filteredResults = data?.filter(user => !existingFriendIds.has(user.id)) || [];
      setSearchResults(filteredResults);

    } catch (error) {
      console.error('Error in searchUsers:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke søke etter brukere",
        variant: "destructive",
      });
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    try {
      console.log('Sending friend request to:', friendId);

      // Sjekk om det allerede finnes en venneforespørsel
      const { data: existingRequest, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      if (checkError) throw checkError;

      if (existingRequest && existingRequest.length > 0) {
        toast({
          title: "Info",
          description: "Det finnes allerede en venneforespørsel mellom dere",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Suksess",
        description: "Venneforespørsel sendt",
      });
      
      setSearchUsername("");
      setSearchResults([]);
      
    } catch (error) {
      console.error('Error in handleSendFriendRequest:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende venneforespørsel",
        variant: "destructive",
      });
    }
  };

  const handleFriendRequest = async (friendshipId: string, accept: boolean) => {
    try {
      console.log('Handling friend request:', friendshipId, accept);

      if (accept) {
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendshipId);

        if (updateError) throw updateError;
        
        toast({
          title: "Suksess",
          description: "Venneforespørsel akseptert",
        });
      } else {
        const { error: deleteError } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);

        if (deleteError) throw deleteError;
        
        toast({
          title: "Info",
          description: "Venneforespørsel avslått",
        });
      }

      // Oppdater listene
      await fetchFriends();

    } catch (error) {
      console.error('Error in handleFriendRequest:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke håndtere venneforespørsel",
        variant: "destructive",
      });
    }
  };

  const setupFriendsSubscription = () => {
    console.log('Setting up friends subscription for user:', currentUserId);
    
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
        (payload) => {
          console.log('Friendship change detected:', payload);
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up friends subscription');
      supabase.removeChannel(channel);
    };
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
