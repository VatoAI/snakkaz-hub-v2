
import React, { useState } from 'react';
import { DecryptedMessage } from "@/types/message";
import { MessageContent } from "./MessageContent";
import { MessageActions } from "./MessageActions";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: DecryptedMessage;
  isCurrentUser: boolean;
  messageIndex: number;
  onMessageExpired: (messageId: string) => void;
  onEdit: (message: DecryptedMessage) => void;
  onDelete: (messageId: string) => void;
}

export const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  messageIndex,
  onMessageExpired,
  onEdit,
  onDelete
}: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div 
      className={cn(
        "group relative rounded-lg px-3 py-2 my-1 max-w-[85%] break-words",
        isCurrentUser 
          ? "bg-gradient-to-br from-snakkaz-blue/80 to-snakkaz-blue/60 text-white ml-auto" 
          : "bg-snakkaz-dark/80 border border-snakkaz-blue/10",
        message.is_encrypted && "border-l-2 border-l-green-500"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        animationDelay: `${messageIndex * 0.05}s`,
      }}
    >
      <MessageContent 
        message={message} 
        onMessageExpired={onMessageExpired} 
      />
      
      {isCurrentUser && !message.is_deleted && (
        <div 
          className={cn(
            "absolute -right-12 top-1/2 transform -translate-y-1/2 transition-opacity",
            showActions ? "opacity-100" : "opacity-0"
          )}
        >
          <MessageActions
            message={message}
            onEdit={() => onEdit(message)}
            onDelete={() => onDelete(message.id)}
          />
        </div>
      )}
    </div>
  );
};
