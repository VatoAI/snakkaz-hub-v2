
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Image, Video, X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent, mediaFile?: File) => void;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  receiverId?: string | null;
}

export const MessageInput = ({ 
  newMessage, 
  setNewMessage, 
  onSubmit, 
  isLoading,
  ttl,
  setTtl,
  receiverId
}: MessageInputProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const ttlOptions = [
    { label: 'Normal melding', value: null },
    { label: '30 sek', value: 30 },
    { label: '5 min', value: 300 },
    { label: '30 min', value: 1800 },
    { label: '1 time', value: 3600 }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if ((file.type.startsWith('image/') || file.type.startsWith('video/')) && file.size <= 10000000) {
        setSelectedFile(file);
      } else {
        alert('Vennligst velg en bilde- eller videofil under 10MB');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, selectedFile || undefined);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex gap-2 w-full">
        {selectedFile && (
          <div className="flex items-center gap-2 bg-cyberdark-800 px-2 py-1 rounded">
            <span className="text-sm text-cybergold-400 truncate max-w-[100px]">
              {selectedFile.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={receiverId ? "Skriv en privat melding..." : "Skriv din melding..."}
          className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
          disabled={isLoading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
          disabled={isLoading}
        >
          {selectedFile?.type.startsWith('video/') ? (
            <Video className="w-4 h-4" />
          ) : (
            <Image className="w-4 h-4" />
          )}
        </Button>
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
        disabled={isLoading || (!newMessage.trim() && !selectedFile)}
        className="w-full sm:w-auto bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900 shadow-neon-gold transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span className="sm:hidden">Send melding</span>
        <span className="hidden sm:inline">Send</span>
      </Button>
    </form>
  );
};
