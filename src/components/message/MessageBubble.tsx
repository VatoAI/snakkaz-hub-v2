
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
      className={`group relative flex mb-1 ${messageIndex === 0 ? '' : 'mt-1'}`}
    >
      <div 
        className={`
          py-2 px-3 rounded-md max-w-full break-words 
          ${isCurrentUser 
            ? 'bg-cyberblue-900 text-white' 
            : 'bg-cyberdark-800 text-cyberblue-100'
          }
        `}
      >
        <MessageContent message={message} onMessageExpired={onMessageExpired} />
        
        {ttlIsFixed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center text-[10px] text-cyberdark-400 mt-1 ml-2">
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
