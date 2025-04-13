
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, User, Users, Moon, Sun, Shield, LogOut } from 'lucide-react';
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { pfsInstance } from "@/utils/encryption";
import { secureConnectionMonitorInstance } from "@/utils/security";

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
  const { toast } = useToast();
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isSecurityMenuOpen, setIsSecurityMenuOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(secureConnectionMonitorInstance.getStatus());

  const currentUserProfile = currentUserId ? userProfiles?.[currentUserId] : null;

  useEffect(() => {
    const handleStartChatEvent = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail && event.detail.friendId) {
        setIsFriendsOpen(true);
      }
    };
    
    const securityStatusHandler = () => {
      setConnectionStatus(secureConnectionMonitorInstance.getStatus());
    };
    
    document.addEventListener('start-chat-with-friend', handleStartChatEvent);
    secureConnectionMonitorInstance.addStatusChangeListener(securityStatusHandler);
    
    return () => {
      document.removeEventListener('start-chat-with-friend', handleStartChatEvent);
      secureConnectionMonitorInstance.removeStatusChangeListener(securityStatusHandler);
    };
  }, []);

  const handleLogout = () => {
    toast({
      title: "Logger ut...",
      description: "Du blir nå logget ut fra SnakkaZ",
    });
    
    // Clear security data before logout
    pfsInstance.clearAllKeys();
    secureConnectionMonitorInstance.resetStatus();
    
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

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

          <div className="hidden sm:flex items-center space-x-1">
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-snakkaz bg-clip-text text-transparent animate-gradient">
                SnakkaZ
              </span>
            </h1>
            <div className={`h-2 w-2 rounded-full ${
              connectionStatus === 'secure' 
                ? 'bg-green-500' 
                : connectionStatus === 'warning' 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`}></div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Security status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "relative overflow-hidden",
                  "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
                  "transition-all duration-300"
                )}
              >
                <Shield className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-snakkaz-dark border-snakkaz-blue/10">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">Sikkerhets Status</p>
                <p className="text-xs text-gray-400">
                  {connectionStatus === 'secure' 
                    ? 'Sikker tilkobling etablert' 
                    : connectionStatus === 'warning'
                    ? 'Delvis sikker tilkobling'
                    : 'Usikker tilkobling - sjekk nettverk'}
                </p>
              </div>
              <DropdownMenuItem 
                onClick={() => {
                  pfsInstance.rotateAllKeys();
                  toast({
                    title: "Sikkerhets oppdatering",
                    description: "Krypteringsnøkler er oppdatert",
                  });
                }}
                className="cursor-pointer"
              >
                Oppdater krypteringsnøkler
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "relative overflow-hidden",
                  "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
                  "transition-all duration-300"
                )}
              >
                <div className="relative">
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-snakkaz-blue opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-snakkaz-blue"></span>
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-snakkaz-dark border-snakkaz-blue/10">
              <div className="px-3 py-2 text-sm font-medium text-white">
                Meldinger
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profil')}>
                Se profil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logg ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
