
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, User, Users } from 'lucide-react';
import { OnlineUsers } from '@/components/OnlineUsers';
import { UserPresence, UserStatus } from '@/types/presence';
import { FriendsList } from './FriendsList';
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
}

export const ChatHeader = ({
  userPresence,
  currentUserId,
  currentStatus,
  onStatusChange
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const [showFriends, setShowFriends] = useState(false);

  return (
    <div className="p-2 sm:p-4 border-b border-cybergold-500/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
              className="bg-cyberdark-800/90 border-cybergold-400/50 text-cybergold-400 hover:bg-cyberdark-700"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/chat')}
              className="bg-cyberdark-800/90 border-cybergold-400/50 text-cybergold-400 hover:bg-cyberdark-700"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/profil')}
              className="bg-cyberdark-800/90 border-cybergold-400/50 text-cybergold-400 hover:bg-cyberdark-700"
            >
              <User className="h-4 w-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-cyberdark-800/90 border-cybergold-400/50 text-cybergold-400 hover:bg-cyberdark-700"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] bg-cyberdark-900 border-cybergold-500/30">
                <SheetHeader>
                  <SheetTitle className="text-cybergold-400">Venner</SheetTitle>
                </SheetHeader>
                {currentUserId && <FriendsList currentUserId={currentUserId} />}
              </SheetContent>
            </Sheet>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-cybergold-200">SnakkaZ</h1>
        </div>
        <div className="w-full sm:w-auto">
          <OnlineUsers
            userPresence={userPresence}
            currentUserId={currentUserId}
            onStatusChange={onStatusChange}
            currentStatus={currentStatus}
          />
        </div>
      </div>
    </div>
  );
};
