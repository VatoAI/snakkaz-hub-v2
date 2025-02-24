
import { User } from "lucide-react";
import { Friend } from "./types";

interface FriendsListProps {
  friends: Friend[];
}

export const FriendsList = ({ friends }: FriendsListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-cybergold-300">Venner</h3>
      {friends.length === 0 ? (
        <p className="text-sm text-cyberdark-400">Ingen venner enda</p>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center gap-2 p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md"
            >
              <User className="w-4 h-4 text-cybergold-400" />
              <span className="text-cybergold-200">
                {friend.profile?.full_name || friend.profile?.username || 'Ukjent bruker'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
