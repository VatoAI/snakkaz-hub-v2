import { DecryptedMessage } from "@/types/message";
import { MessageContent } from "./MessageContent";
import { MessageActions } from "./MessageActions";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();
  const isLastMessage = messageIndex === 0;

  return (
    <div className={`group relative flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          relative max-w-[85%] rounded-2xl px-4 py-2
          ${isCurrentUser 
            ? theme === 'dark' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-500 text-white'
            : theme === 'dark'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-900'
          }
          ${isLastMessage ? 'rounded-br-none' : ''}
          transition-colors duration-200
        `}
      >
        <MessageContent 
          message={message} 
          onMessageExpired={onMessageExpired} 
        />
        
        <div className="flex items-center justify-end gap-1 mt-1">
          {message.is_encrypted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Clock className="w-3 h-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Encrypted message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="text-xs text-gray-400">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageActions
            message={message}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};
