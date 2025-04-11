
import React from "react";
import { Users } from "lucide-react";
import { UserPresence, UserStatus } from "@/types/presence";
import { StatusDropdown } from "./StatusDropdown";
import { VisibilityToggle } from "./VisibilityToggle";
import { UserList } from "./UserList";
import { Badge } from "@/components/ui/badge";

interface OnlineUsersProps {
  userPresence: Record<string, UserPresence>;
  currentUserId: string | null;
  onStatusChange: (status: UserStatus) => void;
  currentStatus: UserStatus;
  onSendFriendRequest: (userId: string) => void;
  onStartChat: (userId: string) => void;
  friends: string[];
  hidden: boolean;
  onToggleHidden: () => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

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
  const onlineCount = Object.keys(userPresence).length;
  const inactiveTimeLimitHours = 1; // Set timeout for inactive users (show in yellow after 1 hour)
  
  // Calculate how many users are actually online (not the current user)
  const actualOnlineCount = currentUserId ? 
    onlineCount - (userPresence[currentUserId] ? 1 : 0) : 
    onlineCount;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cybergold-400" />
          <div className="flex items-center">
            <span className="text-cybergold-200">{actualOnlineCount} pålogget</span>
            {actualOnlineCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-cyberdark-700 text-green-400 text-xs">
                Aktiv
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <VisibilityToggle 
            hidden={hidden} 
            onToggleHidden={onToggleHidden} 
          />
          <StatusDropdown 
            currentStatus={currentStatus} 
            onStatusChange={onStatusChange} 
          />
        </div>
      </div>

      <UserList 
        userPresence={userPresence}
        currentUserId={currentUserId}
        friends={friends}
        onSendFriendRequest={onSendFriendRequest}
        onStartChat={onStartChat}
        userProfiles={userProfiles}
      />
    </div>
  );
};
