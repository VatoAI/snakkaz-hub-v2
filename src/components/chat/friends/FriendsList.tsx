
import { useState } from "react";
import { User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Friend } from "./types";
import { DirectMessage } from "./DirectMessage";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface FriendsListProps {
  friends: Friend[];
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  directMessages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
  onStartChat?: (friendId: string) => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

export const FriendsList = ({ 
  friends, 
  currentUserId,
  webRTCManager,
  directMessages,
  onNewMessage,
  onStartChat,
  userProfiles = {}
}: FriendsListProps) => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());

  if (friends.length === 0) {
    return (
      <div className="text-center text-cybergold-500 py-4 bg-cyberdark-800/40 rounded-md p-4">
        <div className="mb-2 flex justify-center">
          <User className="h-10 w-10 text-cybergold-400/50" />
        </div>
        <p>Du har ingen venner ennå.</p>
        <p className="text-sm mt-1">Søk etter brukere og send venneforespørsler for å begynne å chatte.</p>
      </div>
    );
  }

  const handleSelectFriend = (friend: Friend) => {
    // Mark all messages from this friend as read
    const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
    const messagesFromFriend = directMessages.filter(msg => msg.sender.id === friendId);
    
    const newReadMessages = new Set(readMessages);
    messagesFromFriend.forEach(msg => newReadMessages.add(msg.id));
    
    setReadMessages(newReadMessages);
    
    if (onStartChat) {
      onStartChat(friendId);
    } else {
      setSelectedFriend(friend);
    }
  };

  if (selectedFriend && !onStartChat) {
    return (
      <DirectMessage 
        friend={selectedFriend}
        currentUserId={currentUserId}
        webRTCManager={webRTCManager}
        onBack={() => setSelectedFriend(null)}
        messages={directMessages}
        onNewMessage={onNewMessage}
        userProfiles={userProfiles}
      />
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-cybergold-300 px-1">Dine venner</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {friends.map((friend) => {
          const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
          
          // Get messages from this friend that haven't been read
          const unreadMessages = directMessages.filter(
            msg => msg.sender.id === friendId && !readMessages.has(msg.id)
          );
          
          // Find the most recent message for this friend
          const recentMessages = directMessages.filter(
            msg => (msg.sender.id === friendId && msg.receiver_id === currentUserId) || 
                   (msg.sender.id === currentUserId && msg.receiver_id === friendId)
          ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          const lastMessage = recentMessages.length > 0 ? recentMessages[0] : null;
          const isRecentMessage = lastMessage && 
            (new Date().getTime() - new Date(lastMessage.created_at).getTime() < 60000); // Within last minute
          
          // Get user profile info
          const friendProfile = friend.profile || userProfiles[friendId];
          const username = friendProfile?.username || 'Ukjent bruker';
          const avatarUrl = friendProfile?.avatar_url;
          
          return (
            <div
              key={friend.id}
              className="flex items-center justify-between p-3 bg-cyberdark-800 border border-cybergold-500/30 rounded-md hover:bg-cyberdark-700 transition-colors cursor-pointer"
              onClick={() => handleSelectFriend(friend)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-cybergold-500/20">
                    {avatarUrl ? (
                      <AvatarImage 
                        src={supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl} 
                        alt={username}
                      />
                    ) : (
                      <AvatarFallback className="bg-cybergold-500/20 text-cybergold-300">
                        {username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isRecentMessage && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-cyberdark-800"></span>
                  )}
                </div>
                <div>
                  <p className="text-cybergold-200 font-medium">
                    {username}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-cybergold-400 truncate max-w-[150px]">
                      {lastMessage.sender.id === currentUserId ? 'You: ' : ''}
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-600"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cybergold-500 text-cyberdark-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessages.length}
                  </span>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
