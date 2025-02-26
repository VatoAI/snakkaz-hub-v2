
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Friend } from "./types";

interface FriendRequestsProps {
  friendRequests: Friend[];
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
}

export const FriendRequests = ({ friendRequests, onAccept, onReject }: FriendRequestsProps) => {
  if (friendRequests.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-cybergold-300">Venneforespørsler</h3>
      {friendRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-2 bg-cyberdark-800 border border-cybergold-500/30 rounded-md"
        >
          <span className="text-cybergold-200">
            {request.profile?.username || request.profile?.full_name || 'Ukjent bruker'}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => onAccept(request.id)}
              variant="outline"
              size="sm"
              className="text-green-500 border-green-500/30 hover:bg-green-500/10"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onReject(request.id)}
              variant="outline"
              size="sm"
              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
