
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const MessageInput = ({ newMessage, setNewMessage, onSubmit, isLoading }: MessageInputProps) => {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Skriv din melding..."
        className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        disabled={isLoading || !newMessage.trim()}
        className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900 shadow-neon-gold transition-all duration-300 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span>Send</span>
      </Button>
    </form>
  );
};
