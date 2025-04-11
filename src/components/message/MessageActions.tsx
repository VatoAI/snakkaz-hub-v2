
import { useState } from "react";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DecryptedMessage } from "@/types/message";

interface MessageActionsProps {
  message: DecryptedMessage;
  onEdit: (message: DecryptedMessage) => void;
  onDelete: (messageId: string) => void;
}

export const MessageActions = ({ message, onEdit, onDelete }: MessageActionsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-cyberdark-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-cyberdark-900 border-cybergold-500/30"
      >
        <DropdownMenuItem
          onClick={() => {
            onEdit(message);
            setOpen(false);
          }}
          className="flex items-center gap-2 text-cybergold-200 hover:text-white cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
          <span>Rediger</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onDelete(message.id);
            setOpen(false);
          }}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
        >
          <Trash className="h-4 w-4" />
          <span>Slett</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
