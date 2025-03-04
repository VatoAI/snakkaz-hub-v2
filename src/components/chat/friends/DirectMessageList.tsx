
import { DecryptedMessage } from "@/types/message";
import { useRef, useEffect } from "react";
import { MessageSquare, CheckCheck, Check } from "lucide-react";

interface DirectMessageListProps {
  messages: DecryptedMessage[];
  currentUserId: string;
  peerIsTyping?: boolean;
  isMessageRead?: (messageId: string) => boolean;
}

export const DirectMessageList = ({ messages, currentUserId, peerIsTyping, isMessageRead }: DirectMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerIsTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              {message.is_encrypted && (
                <span className="text-xs opacity-70">🔒</span>
              )}
              
              {/* Add read receipts */}
              {message.sender.id === currentUserId && isMessageRead && (
                <span className="text-xs ml-1">
                  {isMessageRead(message.id) ? (
                    <CheckCheck className="h-3 w-3 text-cybergold-400" />
                  ) : (
                    <Check className="h-3 w-3 text-cyberdark-400" />
                  )}
                </span>
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
