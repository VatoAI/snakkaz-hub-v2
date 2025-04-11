
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Circle, MessageSquare, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusIcon } from "./StatusIcons";
import { UserStatus } from "@/types/presence";

interface UserItemProps {
  id: string;
  username: string;
  isOnline: boolean;
  status: UserStatus | null;
  isFriend: boolean;
  avatarUrl?: string | null;
  onSendFriendRequest: (userId: string) => void;
  onStartChat: (userId: string) => void;
}

export const UserItem = ({ 
  id, 
  username, 
  isOnline, 
  status, 
  isFriend,
  avatarUrl,
  onSendFriendRequest,
  onStartChat
}: UserItemProps) => {
  // Get the first letter of username for avatar fallback
  const fallbackLetter = username?.charAt(0).toUpperCase() || '?';

  return (
    <div 
      className="flex items-center justify-between p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md hover:bg-cyberdark-700 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <Avatar className="h-8 w-8 border border-cybergold-500/20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={username} />
            ) : null}
            <AvatarFallback className="bg-cyberdark-700 text-cybergold-300">
              {fallbackLetter}
            </AvatarFallback>
          </Avatar>
          
          {/* Status indicator */}
          {isOnline && status ? (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-cyberdark-800 flex items-center justify-center">
              <div className={cn(
                "w-2 h-2 rounded-full",
                status === 'online' ? "bg-green-500" : 
                status === 'busy' ? "bg-yellow-500" : 
                "bg-blue-500"
              )}></div>
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-cyberdark-800 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            </div>
          )}
        </div>
        
        <span className="text-cybergold-200 truncate">
          {username}
        </span>
      </div>
      
      <div className="flex gap-1">
        {!isFriend && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSendFriendRequest(id)}
            className="h-7 w-7 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
            title="Legg til venn"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
        
        {isFriend && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStartChat(id)}
            className="h-7 w-7 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
            title="Send melding"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
