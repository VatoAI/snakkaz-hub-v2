
import { useState } from "react";
import { User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Friend } from "./types";
import { DirectMessage } from "./DirectMessage";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";

interface FriendsListProps {
  friends: Friend[];
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  directMessages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
}

export const FriendsList = ({ 
  friends, 
  currentUserId,
  webRTCManager,
  directMessages,
  onNewMessage
}: FriendsListProps) => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  if (friends.length === 0) {
    return (
      <div className="text-center text-cybergold-500 py-4">
        Du har ingen venner ennå. Søk etter brukere og send venneforespørsler.
      </div>
    );
  }

  if (selectedFriend) {
    return (
      <DirectMessage 
        friend={selectedFriend}
        currentUserId={currentUserId}
        webRTCManager={webRTCManager}
        onBack={() => setSelectedFriend(null)}
        messages={directMessages}
        onNewMessage={onNewMessage}
      />
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-cybergold-300">Dine venner</h3>
      {friends.map((friend) => {
        const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
        // Count unread messages without using 'read' property
        const unreadCount = directMessages.filter(
          msg => msg.sender.id === friendId
        ).length;
        
        return (
          <div
            key={friend.id}
            className="flex items-center justify-between p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md hover:bg-cyberdark-700 transition-colors cursor-pointer"
            onClick={() => setSelectedFriend(friend)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cybergold-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-cybergold-300" />
              </div>
              <span className="text-cybergold-200">
                {friend.profile?.username || friend.profile?.full_name || 'Ukjent bruker'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-600"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cybergold-500 text-cyberdark-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
};
