import React from 'react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { DecryptedMessage } from "@/types/message";

interface ChatGlobalProps {
  messages: DecryptedMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  onMessageExpired: (messageId: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  currentUserId: string | null;
  editingMessage: { id: string; content: string } | null;
  onEditMessage: (message: { id: string; content: string }) => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
}

export const ChatGlobal = ({
  messages,
  newMessage,
  setNewMessage,
  isLoading,
  ttl,
  setTtl,
  onMessageExpired,
  onSubmit,
  currentUserId,
  editingMessage,
  onEditMessage,
  onCancelEdit,
  onDeleteMessage
}: ChatGlobalProps) => {
  return (
    <div className="h-full flex flex-col bg-cyberdark-950">
      <div className="flex-1 overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <MessageList 
            messages={messages} 
            onMessageExpired={onMessageExpired}
            currentUserId={currentUserId}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-4">
        <div className="backdrop-blur-sm bg-cyberdark-800/50 rounded-2xl border border-cybergold-500/20">
          <MessageInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSubmit={onSubmit}
            isLoading={isLoading}
            ttl={ttl}
            setTtl={setTtl}
            editingMessage={editingMessage}
            onCancelEdit={onCancelEdit}
          />
        </div>
      </div>
    </div>
  );
};
