
import { DecryptedMessage } from "@/types/message";
import { useRef, useEffect } from "react";
import { MessageSquare, CheckCheck, Check, Lock, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DirectMessageListProps {
  messages: DecryptedMessage[];
  currentUserId: string;
  peerIsTyping?: boolean;
  isMessageRead?: (messageId: string) => boolean;
  connectionState: string;
  dataChannelState: string;
  usingServerFallback: boolean;
}

export const DirectMessageList = ({ 
  messages, 
  currentUserId, 
  peerIsTyping, 
  isMessageRead,
  connectionState,
  dataChannelState,
  usingServerFallback
}: DirectMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSecureConnection = (connectionState === 'connected' && dataChannelState === 'open') || usingServerFallback;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerIsTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {!isSecureConnection && messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <Shield className="h-16 w-16 text-cybergold-500 opacity-20 mb-4" />
          <h3 className="text-cybergold-300 text-lg font-medium mb-2">Etablerer sikker tilkobling</h3>
          <p className="text-cyberdark-400 max-w-md">
            Venter på å etablere en sikker ende-til-ende-kryptert forbindelse.
            Du vil ikke kunne sende eller motta meldinger før tilkoblingen er sikker.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <div 
          key={message.id}
          className={`flex ${message.sender.id === currentUserId ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[80%] p-3 rounded-lg ${
              message.sender.id === currentUserId 
                ? 'bg-cyberblue-900 text-cyberblue-100' 
                : 'bg-cyberdark-800 text-cybergold-200'
            }`}
          >
            <p>{message.content}</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs opacity-70">
                {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs opacity-70">
                      {message.is_encrypted || usingServerFallback ? <Lock className="h-3 w-3 text-green-500" /> : null}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="text-xs">
                    Ende-til-ende kryptert
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Add read receipts */}
              {message.sender.id === currentUserId && isMessageRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs ml-1">
                        {isMessageRead(message.id) ? (
                          <CheckCheck className="h-3 w-3 text-cybergold-400" />
                        ) : (
                          <Check className="h-3 w-3 text-cyberdark-400" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="text-xs">
                      {isMessageRead(message.id) ? 'Lest' : 'Levert'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Typing indicator */}
      {peerIsTyping && (
        <div className="flex justify-start">
          <div className="bg-cyberdark-800 text-cybergold-200 p-2 rounded-lg flex items-center gap-2 max-w-[80%]">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cybergold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-cybergold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-cybergold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-cybergold-300">Skriver...</span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
