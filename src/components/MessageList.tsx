
import { useRef, useEffect, useMemo, useState } from "react";
import { DecryptedMessage } from "@/types/message";
import { MessageGroups } from "./message/MessageGroups";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

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
    if (isAutoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAutoScrollEnabled(true);
  };

  // Check if message is from current user
  const isUserMessage = (message: DecryptedMessage) => {
    return message.sender.id === currentUserId;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cybergold-500/30 scrollbar-track-cyberdark-800 bg-gradient-to-b from-cyberdark-950 to-cyberdark-900"
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
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 rounded-full h-10 w-10 p-0 bg-cyberblue-800 hover:bg-cyberblue-700 text-white shadow-lg"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
