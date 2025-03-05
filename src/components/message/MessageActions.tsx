
import { Edit, Trash2, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { DecryptedMessage } from "@/types/message";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageActionsProps {
  message: DecryptedMessage;
  onEdit: (message: DecryptedMessage) => void;
  onDelete: (messageId: string) => void;
}

export const MessageActions = ({ message, onEdit, onDelete }: MessageActionsProps) => {
  if (message.is_deleted) {
    return null;
  }

  // Allow editing and deletion (24-hour auto-delete still applies)
  const isEditingDisabled = false;
  const isDeletionDisabled = false;

  // Show clock icon with tooltip if both editing and deletion are disabled
  if (isEditingDisabled && isDeletionDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyberdark-400 hover:text-cyberdark-300"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs bg-cyberdark-800 border-cybergold-500/30">
            <p>Meldinger slettes automatisk etter 24 timer.</p>
            <p>Redigering og sletting er deaktivert.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handleEdit = () => {
    console.log("Editing message:", message.id);
    onEdit(message);
  };

  const handleDelete = () => {
    console.log("Deleting message:", message.id);
    onDelete(message.id);
  };

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
      <DropdownMenuContent align="end" className="w-52 bg-cyberdark-800 border-cybergold-500/30">
        <DropdownMenuLabel className="text-xs text-cyberdark-400">
          Meldinger slettes automatisk etter 24 timer
        </DropdownMenuLabel>
          <>
            {!isEditingDisabled && (
              <DropdownMenuItem 
                className="text-cybergold-300 cursor-pointer flex items-center"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Rediger</span>
              </DropdownMenuItem>
            )}
            {!isDeletionDisabled && (
              <DropdownMenuItem 
                className="text-red-400 cursor-pointer flex items-center"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Slett</span>
              </DropdownMenuItem>
            )}
          </>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
