
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Users } from "lucide-react";

interface OnlineUsersProps {
  onlineUsers: Set<string>;
  peerId?: string;
}

export const OnlineUsers = ({ onlineUsers, peerId }: OnlineUsersProps) => {
  const totalUsers = onlineUsers.size;
  const otherUsers = Array.from(onlineUsers).filter(id => id !== peerId);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-cyberdark-800 hover:bg-cyberdark-700 transition-colors cursor-pointer">
          <Users className="w-4 h-4 text-cybergold-400" />
          <span className="text-sm text-cyberblue-100">{totalUsers} online</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-cyberdark-800 border-cybergold-500/30">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-cybergold-300">Online Users</h4>
          <div className="text-sm text-cyberblue-100">
            {otherUsers.length > 0 ? (
              <ul className="space-y-1">
                {otherUsers.map(id => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            ) : (
              <p>No other users online</p>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
