
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
import { cn } from "@/lib/utils";

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

  const currentUserProfile = currentUserId ? userProfiles?.[currentUserId] : null;

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
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-snakkaz animate-gradient shadow-snakkaz" />
      <div className="flex items-center justify-between px-4 py-3 bg-snakkaz-dark border-b border-snakkaz-blue/5 shadow-snakkaz">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className={cn(
              "relative overflow-hidden",
              "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
              "transition-all duration-300"
            )}
          >
            <Home className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleHidden}
            className={cn(
              "relative overflow-hidden",
              "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
              "transition-all duration-300"
            )}
          >
            <Users className="h-5 w-5" />
          </Button>

          <h1 className="hidden sm:block text-xl font-bold">
            <span className="bg-gradient-snakkaz bg-clip-text text-transparent animate-gradient">
              SnakkaZ Chat
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className={cn(
              "relative overflow-hidden",
              "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
              "transition-all duration-300"
            )}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Sheet open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "relative overflow-hidden",
                  "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
                  "transition-all duration-300"
                )}
              >
                <User className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-snakkaz-dark border-snakkaz-blue/10">
              <SheetHeader>
                <SheetTitle className="bg-gradient-snakkaz bg-clip-text text-transparent">
                  Brukerprofil
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <OnlineUsers
                  userPresence={userPresence}
                  currentUserId={currentUserId}
                  currentStatus={currentStatus}
                  onStatusChange={onStatusChange}
                  friends={friends}
                  onSendFriendRequest={onSendFriendRequest}
                  onStartChat={onStartChat}
                  userProfiles={userProfiles}
                  hidden={hidden || false}
                  onToggleHidden={onToggleHidden || (() => {})}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};
