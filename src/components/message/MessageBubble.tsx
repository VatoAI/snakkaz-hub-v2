import { DecryptedMessage } from "@/types/message";
import { MessageContent } from "./MessageContent";
import { MessageActions } from "./MessageActions";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { theme } = useTheme();
  const isLastMessage = messageIndex === 0;

  return (
    <div className={`group relative flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={cn(
          "relative max-w-[85%] px-4 py-2 shadow-md transition-all duration-200",
          isCurrentUser
            ? "rounded-2xl rounded-br-sm bg-gradient-snakkaz shadow-snakkaz"
            : theme === 'dark'
              ? "rounded-2xl rounded-bl-sm bg-snakkaz-darker/80 border border-snakkaz-blue/5"
              : "rounded-2xl rounded-bl-sm bg-gray-100/90 border border-snakkaz-blue/5",
          "hover:shadow-snakkaz-hover transform hover:-translate-y-0.5 transition-all duration-300",
          isCurrentUser ? "text-white" : theme === 'dark' ? "text-gray-100" : "text-gray-900"
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          isCurrentUser ? "bg-gradient-snakkaz-glow group-hover:opacity-100" : ""
        )} />
        
        <div className="relative z-10">
          <MessageContent 
            message={message} 
            onMessageExpired={onMessageExpired} 
          />
          
          <div className="flex items-center justify-end gap-1 mt-1">
            {message.is_encrypted && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Clock className={cn(
                      "w-3 h-3",
                      isCurrentUser ? "text-white/70" : theme === 'dark' ? "text-gray-400" : "text-gray-500"
                    )} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kryptert melding</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className={cn(
              "text-xs",
              isCurrentUser ? "text-white/70" : theme === 'dark' ? "text-gray-400" : "text-gray-500"
            )}>
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20",
          isCurrentUser ? "-right-2" : "-left-2"
        )}>
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
