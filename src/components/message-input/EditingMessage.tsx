
import { Button } from "@/components/ui/button";

interface EditingMessageProps {
  editingMessage: { id: string; content: string };
  onCancelEdit: () => void;
}

export const EditingMessage = ({ editingMessage, onCancelEdit }: EditingMessageProps) => {
  return (
    <div className="flex justify-between items-center w-full p-2 mb-2 bg-cyberdark-800 rounded-md border border-cybergold-500/20">
      <div className="text-xs text-cybergold-300">
        <span className="font-medium">Redigerer melding</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancelEdit}
        className="h-6 text-xs px-2 py-0 bg-transparent border-cybergold-500/30 text-cybergold-300 hover:bg-cyberdark-700"
      >
        Avbryt
      </Button>
    </div>
  );
};
