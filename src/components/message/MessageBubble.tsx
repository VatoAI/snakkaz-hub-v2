
import { DecryptedMessage } from "@/types/message";
import { MessageContent } from "./MessageContent";
import { MessageActions } from "./MessageActions";

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
  return (
    <div 
      key={message.id}
      className={`group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} p-2 sm:p-3 rounded-lg transition-all duration-300 ${
        isCurrentUser 
          ? 'bg-cybergold-900/20 hover:bg-cybergold-900/30' 
          : 'bg-cyberdark-800/50 hover:bg-cyberdark-800/70'
      } ${messageIndex > 0 ? 'mt-1' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <MessageContent 
          message={message} 
          onMessageExpired={onMessageExpired} 
        />
      </div>
      
      {isCurrentUser && (
        <MessageActions 
          message={message} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      )}
    </div>
  );
};
