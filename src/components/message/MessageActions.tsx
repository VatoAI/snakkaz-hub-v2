
import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DecryptedMessage } from "@/types/message";

interface MessageActionsProps {
  message: DecryptedMessage;
  onEdit: (message: DecryptedMessage) => void;
  onDelete: (messageId: string) => void;
}

export const MessageActions = ({ message, onEdit, onDelete }: MessageActionsProps) => {
  if (message.is_deleted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyberdark-400 hover:text-cyberdark-300"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-cyberdark-800 border-cybergold-500/30">
        <DropdownMenuItem 
          className="text-cybergold-300 cursor-pointer flex items-center"
          onClick={() => onEdit(message)}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Rediger</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-400 cursor-pointer flex items-center"
          onClick={() => onDelete(message.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Slett</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
