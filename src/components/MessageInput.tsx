
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const MessageInput = ({ newMessage, setNewMessage, onSubmit, isLoading }: MessageInputProps) => {
  return (
    <form onSubmit={onSubmit} className="mt-4 flex gap-2">
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Skriv din melding..."
        className="flex-1"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        disabled={isLoading || !newMessage.trim()}
        className="bg-theme-600 hover:bg-theme-700 text-white"
      >
        Send
      </Button>
    </form>
  );
};
