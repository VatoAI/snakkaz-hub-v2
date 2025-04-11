import { useRef, useEffect, useMemo, useState } from "react";
import { DecryptedMessage } from "@/types/message";
import { MessageGroups } from "./message/MessageGroups";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface MessageListProps {
  messages: DecryptedMessage[];
  onMessageExpired: (messageId: string) => void;
  currentUserId: string | null;
  onEditMessage: (message: { id: string; content: string }) => void;
  onDeleteMessage: (messageId: string) => void;
}

export const MessageList = ({
  messages,
  onMessageExpired,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) => {
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  // Group messages by sender and within 5 minutes
  const messageGroups = useMemo(() => {
    const groups: DecryptedMessage[][] = [];
    let currentGroup: DecryptedMessage[] = [];
    let currentSenderId: string | null = null;
    let lastMessageTime: number | null = null;

    messages.forEach((message) => {
      const messageTime = new Date(message.created_at).getTime();
      const isSameUser = message.sender.id === currentSenderId;
      const isWithinTimeWindow = lastMessageTime && messageTime - lastMessageTime < 5 * 60 * 1000;

      if (isSameUser && isWithinTimeWindow) {
        currentGroup.push(message);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [message];
        currentSenderId = message.sender.id;
      }

      lastMessageTime = messageTime;
    });

    if (currentGroup.length > 0) {
      groups.push([...currentGroup]);
    }

    return groups;
  }, [messages]);

  // Scroll to bottom when messages change, if auto-scroll is enabled
  useEffect(() => {
    if (isAutoScrollEnabled && messagesEndRef.current && !isScrolling) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled, isScrolling]);

  // Handle scroll events to show/hide scroll button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShowScrollButton(!isNearBottom);
      setIsAutoScrollEnabled(isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    setIsScrolling(true);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAutoScrollEnabled(true);
    setTimeout(() => setIsScrolling(false), 500);
  };

  // Check if message is from current user
  const isUserMessage = (message: DecryptedMessage) => {
    return message.sender.id === currentUserId;
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
    >
      {messageGroups.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-6 bg-cyberdark-800/50 rounded-lg border border-cybergold-500/20 max-w-md">
            <h3 className="text-xl font-bold text-cybergold-300 mb-2">Ingen meldinger ennå</h3>
            <p className="text-cyberblue-300">
              Start samtalen ved å sende den første meldingen!
            </p>
          </div>
        </div>
      )}

      <MessageGroups
        messageGroups={messageGroups}
        isUserMessage={isUserMessage}
        onMessageExpired={onMessageExpired}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
        messagesEndRef={messagesEndRef}
      />

      {showScrollButton && (
        <Button
          variant="ghost"
          size="icon"
          className={`fixed bottom-4 right-4 rounded-full ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
