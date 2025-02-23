
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, X, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Friend {
  id: string;
  status: string;
  user: {
    username: string | null;
    full_name: string | null;
  };
}

export const FriendsList = ({ currentUserId }: { currentUserId: string }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
    setupFriendsSubscription();
  }, [currentUserId]);

  const fetchFriends = async () => {
    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          friend:profiles!friendships_friend_id_fkey(username, full_name)
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (error) throw error;

      const processedFriends = friendships.map(friendship => ({
        ...friendship,
        user: friendship.friend
      }));

      setFriends(processedFriends.filter(f => f.status === 'accepted'));
      setFriendRequests(processedFriends.filter(f => f.status === 'pending'));
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke hente venner",
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

  const sendFriendRequest = async (email: string) => {
    try {
      // Først finn bruker-ID basert på e-post
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('email', email)
        .single();

      if (userError || !users) {
        toast({
          title: "Feil",
          description: "Fant ikke bruker med denne e-postadressen",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: users.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Suksess",
        description: "Venneforespørsel sendt",
      });
      setNewFriendEmail("");
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
      <div className="flex gap-2">
        <input
          type="email"
          value={newFriendEmail}
          onChange={(e) => setNewFriendEmail(e.target.value)}
          placeholder="Venn's e-post"
          className="flex-1 px-3 py-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md text-cybergold-200 placeholder:text-cyberdark-400"
        />
        <Button
          onClick={() => sendFriendRequest(newFriendEmail)}
          className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Legg til
        </Button>
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
                {request.user.full_name || request.user.username}
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
                  {friend.user.full_name || friend.user.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
