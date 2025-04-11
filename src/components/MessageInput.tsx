import React, { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, SendHorizontal, X } from 'lucide-react';
import { MessageTimer } from './message/MessageTimer';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  editingMessage: { id: string; content: string } | null;
  onCancelEdit: () => void;
}

export const MessageInput = ({
  newMessage,
  setNewMessage,
  onSubmit,
  isLoading,
  ttl,
  setTtl,
  editingMessage,
  onCancelEdit
}: MessageInputProps) => {
  return (
    <form onSubmit={onSubmit} className="relative p-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-snakkaz-border opacity-50" />
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={editingMessage ? "Rediger melding..." : "Skriv en melding..."}
          className={cn(
            "min-h-[44px] max-h-32 resize-none bg-snakkaz-dark",
            "rounded-2xl border-0",
            "focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-snakkaz-blue/20",
            "placeholder:text-gray-400 pr-24 py-3 px-4",
            "shadow-snakkaz transition-all duration-200"
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        
        {editingMessage && (
          <div className="absolute top-2 left-2 flex items-center gap-2 text-xs z-10">
            <span className="bg-gradient-snakkaz bg-clip-text text-transparent font-medium">
              Redigerer melding
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                "hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
                "transition-all duration-300"
              )}
              onClick={onCancelEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="absolute right-2 bottom-2 flex items-center gap-2 z-10">
          <MessageTimer ttl={ttl} setTtl={setTtl} />
          
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isLoading}
            className={cn(
              "relative h-8 w-8 rounded-full overflow-hidden",
              "bg-gradient-snakkaz shadow-snakkaz",
              "hover:shadow-snakkaz-hover",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transform active:scale-95 transition-all duration-200"
            )}
          >
            <div className="absolute inset-0 bg-gradient-snakkaz-glow opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
};
