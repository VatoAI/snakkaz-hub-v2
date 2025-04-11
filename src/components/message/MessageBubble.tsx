import { DecryptedMessage } from "@/types/message";
import { MessageContent } from "./MessageContent";
import { MessageActions } from "./MessageActions";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // All messages still have 24-hour auto-delete
  const ttlIsFixed = true;
  const isAutoDelete = message.ephemeral_ttl ? true : false;

  return (
    <div 
      className={`group relative flex mb-2 ${messageIndex === 0 ? '' : 'mt-1'}`}
    >
      <div 
        className={`
          py-2.5 px-4 rounded-2xl max-w-[85%] break-words 
          backdrop-blur-sm shadow-lg
          ${isCurrentUser 
            ? 'bg-blue-500/90 text-white ml-auto' 
            : 'bg-cyberdark-800/80 text-cyberblue-100'
          }
        `}
      >
        <MessageContent message={message} onMessageExpired={onMessageExpired} />
        
        {ttlIsFixed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center text-[10px] mt-1 ml-2 ${
                  isCurrentUser ? 'text-blue-100/70' : 'text-cyberdark-400'
                }`}>
                  <Clock className="h-3 w-3 mr-1" />
                  24t
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="text-xs">
                Slettes automatisk etter 24 timer
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Show actions on hover if it's the current user's message */}
      {isCurrentUser && (
        <div className="self-start ml-1">
          <MessageActions 
            message={message} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        </div>
      )}
    </div>
  );
};
