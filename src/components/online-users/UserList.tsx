
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserItem } from "./UserItem";
import { UserPresence, UserStatus } from "@/types/presence";

interface UserListProps {
  userPresence: Record<string, UserPresence>;
  currentUserId: string | null;
  friends: string[];
  onSendFriendRequest: (userId: string) => void;
  onStartChat: (userId: string) => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

export const UserList = ({
  userPresence,
  currentUserId,
  friends,
  onSendFriendRequest,
  onStartChat,
  userProfiles = {}
}: UserListProps) => {
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<{id: string, username: string | null}[]>([]);
  const { toast } = useToast();

  // Fetch all users to show offline users too
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .neq('id', currentUserId || '');
          
        if (error) throw error;
        setAllUsers(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Feil ved henting av brukere",
          description: "Kunne ikke hente brukerlisten",
          variant: "destructive",
        });
      }
    };
    
    if (showAllUsers) {
      fetchAllUsers();
    }
  }, [showAllUsers, currentUserId, toast]);

  const toggleShowAllUsers = () => {
    setShowAllUsers(!showAllUsers);
  };

  const getUsersToDisplay = () => {
    if (showAllUsers) {
      return allUsers.map(user => {
        const isOnline = userPresence[user.id] !== undefined;
        const status = isOnline ? userPresence[user.id].status : null;
        const isFriend = friends.includes(user.id);
        const displayName = userProfiles[user.id]?.username || user.username || user.id.substring(0, 8);
        
        return {
          id: user.id,
          username: displayName,
          status,
          isOnline,
          isFriend
        };
      });
    } else {
      return Object.entries(userPresence)
        .filter(([userId]) => userId !== currentUserId)
        .map(([userId, presence]) => {
          const isFriend = friends.includes(userId);
          const displayName = userProfiles[userId]?.username || 
                             allUsers.find(u => u.id === userId)?.username || 
                             userId.substring(0, 8);
          
          return {
            id: userId,
            username: displayName,
            status: presence.status,
            isOnline: true,
            isFriend
          };
        });
    }
  };

  const usersToDisplay = getUsersToDisplay();

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleShowAllUsers}
        className="w-full bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700 mb-2"
      >
        {showAllUsers ? "Vis bare påloggede" : "Vis alle brukere"}
      </Button>
      
      <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
        {usersToDisplay.length === 0 ? (
          <div className="text-center text-cybergold-500 py-2 text-sm">
            {showAllUsers ? "Ingen andre brukere funnet" : "Ingen påloggede brukere"}
          </div>
        ) : (
          usersToDisplay.map(user => (
            <UserItem
              key={user.id}
              id={user.id}
              username={user.username}
              isOnline={user.isOnline}
              status={user.status}
              isFriend={user.isFriend}
              onSendFriendRequest={onSendFriendRequest}
              onStartChat={onStartChat}
            />
          ))
        )}
      </div>
    </div>
  );
};
