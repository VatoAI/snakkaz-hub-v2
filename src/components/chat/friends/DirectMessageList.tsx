
import { DecryptedMessage } from "@/types/message";
import { useRef, useEffect } from "react";

interface DirectMessageListProps {
  messages: DecryptedMessage[];
  currentUserId: string;
}

export const DirectMessageList = ({ messages, currentUserId }: DirectMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
