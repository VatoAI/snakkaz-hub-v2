import React, { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, SendHorizontal, X } from 'lucide-react';
import { MessageTimer } from './message/MessageTimer';

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
    <form onSubmit={onSubmit} className="relative p-2">
      <Textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder={editingMessage ? "Rediger melding..." : "Skriv en melding..."}
        className="min-h-[44px] max-h-32 resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
          }
        }}
      />
      
      {editingMessage && (
        <div className="absolute top-2 left-2 flex items-center gap-2 text-xs text-cybergold-400">
          <span>Redigerer melding</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="absolute right-2 bottom-2 flex items-center gap-2">
        <MessageTimer ttl={ttl} setTtl={setTtl} />
        
        <Button
          type="submit"
          size="icon"
          disabled={!newMessage.trim() || isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white h-8 w-8 rounded-full shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};
