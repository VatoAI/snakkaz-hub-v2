
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { UserPresence, UserStatus } from "@/types/presence";
import { Users, Circle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnlineUsersProps {
  userPresence: Record<string, UserPresence>;
  currentUserId: string | null;
  onStatusChange: (status: UserStatus) => void;
  currentStatus: UserStatus;
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

export const OnlineUsers = ({ 
  userPresence, 
  currentUserId,
  onStatusChange,
  currentStatus
}: OnlineUsersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const onlineCount = Object.keys(userPresence).length;
  const StatusIcon = statusIcons[currentStatus];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-cybergold-400" />
        <span className="text-cybergold-200">{onlineCount} pålogget</span>
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700"
          >
            <StatusIcon className={cn(
              "w-4 h-4 mr-2",
              currentStatus === 'online' && "text-green-500",
              currentStatus === 'busy' && "text-yellow-500",
              currentStatus === 'brb' && "text-blue-500"
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
              {React.createElement(statusIcons[status as UserStatus], {
                className: cn(
                  "w-4 h-4",
                  status === 'online' && "text-green-500",
                  status === 'busy' && "text-yellow-500",
                  status === 'brb' && "text-blue-500"
                )
              })}
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="text-sm text-cybergold-300">
        {Object.entries(userPresence).map(([userId, presence]) => (
          userId !== currentUserId && (
            <div key={userId} className="flex items-center gap-2">
              {React.createElement(statusIcons[presence.status], {
                className: cn(
                  "w-3 h-3",
                  presence.status === 'online' && "text-green-500",
                  presence.status === 'busy' && "text-yellow-500",
                  presence.status === 'brb' && "text-blue-500"
                )
              })}
              <span>
                {presence.user_id}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};
