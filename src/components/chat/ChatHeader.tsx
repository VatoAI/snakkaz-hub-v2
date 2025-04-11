import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, User, Users, Moon, Sun } from 'lucide-react';
import { OnlineUsers } from '@/components/online-users/OnlineUsers';
import { UserPresence, UserStatus } from '@/types/presence';
import { FriendsContainer } from './friends/FriendsContainer';
import { DecryptedMessage } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIcon } from '@/components/online-users/StatusIcons';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ChatHeaderProps {
  userPresence: Record<string, UserPresence>;
  currentUserId: string | null;
  currentStatus: UserStatus;
  onStatusChange: (status: UserStatus) => void;
  webRTCManager?: any;
  directMessages?: DecryptedMessage[];
  onNewMessage?: (message: DecryptedMessage) => void;
  friends?: string[];
  onSendFriendRequest?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
  hidden?: boolean;
  onToggleHidden?: () => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

export const ChatHeader = ({
  userPresence,
  currentUserId,
  currentStatus,
  onStatusChange,
  webRTCManager,
  directMessages,
  onNewMessage,
  friends,
  onSendFriendRequest,
  onStartChat,
  hidden,
  onToggleHidden,
  userProfiles
}: ChatHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);

  const currentUserProfile = currentUserId ? userProfiles[currentUserId] : null;

  useEffect(() => {
    const handleStartChatEvent = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail && event.detail.friendId) {
        setIsFriendsOpen(true);
      }
    };
    
    document.addEventListener('start-chat-with-friend', handleStartChatEvent);
    
    return () => {
      document.removeEventListener('start-chat-with-friend', handleStartChatEvent);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <Home className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={onToggleHidden}>
          <Users className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Sheet open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>User Profile</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <OnlineUsers
                userPresence={userPresence}
                currentUserId={currentUserId}
                currentStatus={currentStatus}
                onStatusChange={onStatusChange}
                webRTCManager={webRTCManager}
                directMessages={directMessages}
                onNewMessage={onNewMessage}
                friends={friends}
                onSendFriendRequest={onSendFriendRequest}
                onStartChat={onStartChat}
                userProfiles={userProfiles}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
