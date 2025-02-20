
import { DecryptedMessage } from "@/types/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Timer } from "lucide-react";
import { useState, useEffect } from "react";

interface MessageListProps {
  messages: DecryptedMessage[];
  onMessageExpired?: (messageId: string) => void;
}

const MessageTimer = ({ message, onExpired }: { message: DecryptedMessage; onExpired?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!message.ephemeral_ttl) return;

    const calculateTimeLeft = () => {
      const createdAt = new Date(message.created_at).getTime();
      const expiresAt = createdAt + (message.ephemeral_ttl * 1000);
      const now = new Date().getTime();
      const difference = expiresAt - now;
      
      return difference > 0 ? Math.ceil(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [message.created_at, message.ephemeral_ttl, onExpired]);

  if (timeLeft === null || !message.ephemeral_ttl) return null;
  if (timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = minutes > 0 
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  return (
    <div className="flex items-center gap-1 text-xs text-cybergold-300">
      <Timer className="w-3 h-3 text-cyberblue-400" />
      <span className="font-medium">{timeString}</span>
    </div>
  );
};

export const MessageList = ({ messages: initialMessages, onMessageExpired }: MessageListProps) => {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleMessageExpired = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (onMessageExpired) {
      onMessageExpired(messageId);
    }
  };

  return (
    <ScrollArea className="h-full px-2 sm:px-4 py-2 sm:py-4">
      <div className="space-y-2 sm:space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            <div className="group flex items-start gap-x-2 sm:gap-x-3 hover:bg-cyberdark-800/50 p-2 sm:p-3 rounded-lg transition-all duration-300">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cyberdark-700 border border-cybergold-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-cybergold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-cybergold-300 mb-1 group-hover:text-cybergold-200 transition-colors">
                  {message.sender.full_name || message.sender.username || 'Anonym'}
                </p>
                <p className="text-cyberblue-100 text-xs sm:text-sm break-words">
                  {message.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] sm:text-xs text-cyberdark-400 group-hover:text-cyberdark-300">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                  <MessageTimer 
                    message={message} 
                    onExpired={() => handleMessageExpired(message.id)} 
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
