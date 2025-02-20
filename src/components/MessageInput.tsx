
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
}

export const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSubmit, 
  isLoading,
  ttl,
  setTtl
}: MessageInputProps) => {
  const ttlOptions = [
    { label: 'Normal melding', value: null },
    { label: '30 sek', value: 30 },
    { label: '5 min', value: 300 },
    { label: '30 min', value: 1800 },
    { label: '1 time', value: 3600 }
  ];

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex gap-2 w-full">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv din melding..."
          className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
          disabled={isLoading}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              type="button"
              variant="outline" 
              size="icon"
              className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
              disabled={isLoading}
            >
              <Clock className="w-4 h-4" />
              <span className="sr-only">Velg tidsgrense</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-cyberdark-800 border-cybergold-500/30">
            {ttlOptions.map((option) => (
              <DropdownMenuItem
                key={option.value ?? 'permanent'}
                onClick={() => setTtl(option.value)}
                className="text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700 cursor-pointer"
              >
                {option.label} {ttl === option.value && '✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !newMessage.trim()}
        className="w-full sm:w-auto bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900 shadow-neon-gold transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span className="sm:hidden">Send melding</span>
        <span className="hidden sm:inline">Send</span>
      </Button>
    </form>
  );
};
