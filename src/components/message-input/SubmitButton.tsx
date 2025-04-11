
import { Send, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isLoading: boolean;
  newMessage: string;
  selectedFile: File | null;
  isRecording: boolean;
  editingMessage?: { id: string; content: string } | null;
}

export const SubmitButton = ({
  isLoading,
  newMessage,
  selectedFile,
  isRecording,
  editingMessage
}: SubmitButtonProps) => {
  const isDisabled = 
    isLoading || 
    isRecording || 
    (!newMessage.trim() && !selectedFile);

  return (
    <Button
      type="submit"
      size="icon"
      disabled={isDisabled}
      className={`
        h-10 w-10 rounded-full text-white 
        ${isDisabled 
          ? 'bg-cyberdark-700 text-cyberdark-500' 
          : editingMessage 
            ? 'bg-cybergold-700 hover:bg-cybergold-600' 
            : 'bg-cyberblue-700 hover:bg-cyberblue-600'}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : editingMessage ? (
        <Edit className="h-5 w-5" />
      ) : (
        <Send className="h-5 w-5" />
      )}
    </Button>
  );
};
