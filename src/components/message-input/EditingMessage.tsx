
import { Button } from "@/components/ui/button";

interface EditingMessageProps {
  editingMessage: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

export const EditingMessage = ({ editingMessage, onCancelEdit }: EditingMessageProps) => {
  if (!editingMessage) return null;
  
  return (
    <div className="w-full mb-2 bg-cyberdark-800/70 p-2 rounded-md border border-cybergold-400/30">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-cybergold-300">Redigerer melding</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancelEdit}
          className="h-5 px-2 text-xs text-cybergold-400 hover:text-cybergold-300"
        >
          Avbryt
        </Button>
      </div>
      <div className="text-sm text-cybergold-200 truncate">{editingMessage.content}</div>
    </div>
  );
};
