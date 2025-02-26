
import React, { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { UserPresence, UserStatus } from "@/types/presence";
import { Users, Circle, Clock, Loader2, Eye, EyeOff, UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface OnlineUsersProps {
  userPresence: Record<string, UserPresence>;
  currentUserId: string | null;
  onStatusChange: (status: UserStatus) => void;
  currentStatus: UserStatus;
  onSendFriendRequest: (userId: string) => void;
  onStartChat: (userId: string) => void;
  friends: string[]; // Liste over vennenes bruker-IDer
  hidden: boolean;
  onToggleHidden: () => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

const statusIcons = {
  online: Circle,
  busy: Clock,
  brb: Loader2
};

const statusLabels = {
  online: "Online",
  busy: "Opptatt",
  brb: "BRB"
};

const statusColors = {
  online: "text-green-500",
  busy: "text-yellow-500",
  brb: "text-blue-500"
};

export const OnlineUsers = ({ 
  userPresence, 
  currentUserId,
  onStatusChange,
  currentStatus,
  onSendFriendRequest,
  onStartChat,
  friends,
  hidden,
  onToggleHidden,
  userProfiles = {}
}: OnlineUsersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const { toast } = useToast();
  
  const onlineCount = Object.keys(userPresence).length;
  const StatusIcon = statusIcons[currentStatus];
  
  // Hent alle brukere fra profiles for å vise offline brukere også
  const [allUsers, setAllUsers] = useState<{id: string, username: string | null}[]>([]);
  
  React.useEffect(() => {
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cybergold-400" />
          <span className="text-cybergold-200">{onlineCount} pålogget</span>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onToggleHidden}
            className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700"
          >
            {hidden ? (
              <><EyeOff className="w-4 h-4 mr-2" /> Skjult</>
            ) : (
              <><Eye className="w-4 h-4 mr-2" /> Synlig</>
            )}
          </Button>

          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700"
              >
                <StatusIcon className={cn(
                  "w-4 h-4 mr-2",
                  statusColors[currentStatus]
                )} />
                {statusLabels[currentStatus]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-cyberdark-800 border-cybergold-500/30">
              {Object.entries(statusLabels).map(([status, label]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => {
                    onStatusChange(status as UserStatus);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer",
                    currentStatus === status && "bg-cyberdark-700"
                  )}
                >
                  {(() => {
                    const Icon = statusIcons[status as UserStatus];
                    return (
                      <Icon className={cn(
                        "w-4 h-4",
                        statusColors[status as UserStatus]
                      )} />
                    );
                  })()}
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
              <div 
                key={user.id}
                className="flex items-center justify-between p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md"
              >
                <div className="flex items-center gap-2">
                  {user.isOnline && user.status ? (
                    (() => {
                      const Icon = statusIcons[user.status];
                      return (
                        <Icon className={cn(
                          "w-3 h-3",
                          statusColors[user.status]
                        )} />
                      );
                    })()
                  ) : (
                    <Circle className="w-3 h-3 text-gray-500" />
                  )}
                  <span className="text-cybergold-200 truncate">
                    {user.username}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {!user.isFriend && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSendFriendRequest(user.id)}
                      className="h-7 w-7 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
                      title="Legg til venn"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {user.isFriend && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onStartChat(user.id)}
                      className="h-7 w-7 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
                      title="Send melding"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
