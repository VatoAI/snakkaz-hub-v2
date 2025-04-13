
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SnakkazButton } from '@/components/ui/snakkaz-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaperclipIcon, Send, X, Clock, Lock, ChevronDown, Image } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type MessageInputProps = {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent, mediaFile?: File) => Promise<void>;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  editingMessage: { id: string; content: string } | null;
  onCancelEdit: () => void;
};

export const MessageInput = ({
  newMessage,
  setNewMessage,
  onSubmit,
  isLoading,
  ttl,
  setTtl,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    await onSubmit(e, selectedFile || undefined);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {selectedFile && (
        <div className="absolute -top-12 left-0 right-0 bg-snakkaz-dark/80 p-2 rounded-t-lg border border-snakkaz-blue/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image size={16} className="text-cyberblue-400" />
            <span className="text-xs text-cyberblue-300 truncate max-w-[100px] sm:max-w-[200px]">
              {selectedFile.name}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={() => setSelectedFile(null)}
          >
            <X size={14} />
          </Button>
        </div>
      )}
      
      <div className="flex items-center space-x-2 p-2">
        {editingMessage && (
          <div className="absolute -top-6 left-0 right-0 flex justify-between items-center bg-gradient-snakkaz-dark p-1 rounded-t-md">
            <span className="text-xs text-white/80">Redigerer melding</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={onCancelEdit}
            >
              <X size={12} />
            </Button>
          </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                className="h-8 w-8 p-0 text-cybergold-400 hover:text-cybergold-300 bg-cyberdark-800/50"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Legg til fil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
        
        <div className="relative flex-1">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv en melding..."
            className="w-full bg-cyberdark-800/50 border-none text-white focus-visible:ring-snakkaz-blue/30 pl-2 pr-10"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
            {isLocked && (
              <Lock size={14} className="text-green-500 mr-1" />
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              className="h-8 px-2 bg-cyberdark-800/50 hover:bg-cyberdark-700/50 text-cybergold-400 hover:text-cybergold-300"
              variant="ghost"
              size="sm"
            >
              {ttl ? (
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span className="text-xs">{ttl}s</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <ChevronDown size={14} />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-snakkaz-dark border-snakkaz-blue/10">
            <DropdownMenuItem onClick={() => setTtl(null)}>
              Ingen utløpstid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTtl(10)}>
              10 sekunder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTtl(30)}>
              30 sekunder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTtl(60)}>
              1 minutt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTtl(300)}>
              5 minutter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <SnakkazButton
          type="submit"
          disabled={isLoading || (!newMessage.trim() && !selectedFile)}
          className="h-8 px-3"
        >
          <Send size={16} />
        </SnakkazButton>
      </div>
    </form>
  );
};
