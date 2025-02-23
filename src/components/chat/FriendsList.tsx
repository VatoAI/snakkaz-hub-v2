
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, X, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Friend {
  id: string;
  status: string;
  friend_id: string;
  user_id: string;
  profile: {
    username: string | null;
    full_name: string | null;
  } | null;
}

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
}

export const FriendsList = ({ currentUserId }: { currentUserId: string }) => {
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
        setFriends(friendships.filter(f => f.status === 'accepted'));
        setFriendRequests(friendships.filter(f => f.status === 'pending'));
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

      if (data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
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

  const sendFriendRequest = async (friendId: string) => {
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
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => {
                setSearchUsername(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Søk etter brukernavn"
              className="w-full px-3 py-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md text-cybergold-200 placeholder:text-cyberdark-400"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-cyberdark-400" />
          </div>
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-cyberdark-800 border border-cybergold-500/30 rounded-md shadow-lg">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-cyberdark-700"
              >
                <span className="text-cybergold-200">
                  {user.username || user.full_name || 'Ukjent bruker'}
                </span>
                <Button
                  onClick={() => sendFriendRequest(user.id)}
                  size="sm"
                  variant="outline"
                  className="border-cybergold-500/30 text-cybergold-400 hover:bg-cybergold-500/10"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {friendRequests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-cybergold-300">Venneforespørsler</h3>
          {friendRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md"
            >
              <span className="text-cybergold-200">
                {request.profile?.full_name || request.profile?.username || 'Ukjent bruker'}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleFriendRequest(request.id, true)}
                  variant="outline"
                  size="sm"
                  className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleFriendRequest(request.id, false)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-cybergold-300">Venner</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-cyberdark-400">Ingen venner enda</p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-2 p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md"
              >
                <User className="w-4 h-4 text-cybergold-400" />
                <span className="text-cybergold-200">
                  {friend.profile?.full_name || friend.profile?.username || 'Ukjent bruker'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
