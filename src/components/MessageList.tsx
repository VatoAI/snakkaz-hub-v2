
import { DecryptedMessage } from "@/types/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MessageGroup } from "./message/MessageGroup";
import { DeleteMessageDialog } from "./message/DeleteMessageDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

interface MessageListProps {
  messages: DecryptedMessage[];
  onMessageExpired?: (messageId: string) => void;
  currentUserId?: string | null;
  onEditMessage?: (message: DecryptedMessage) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const MessageList = ({ 
  messages: initialMessages, 
  onMessageExpired,
  currentUserId,
  onEditMessage,
  onDeleteMessage
}: MessageListProps) => {
  const [messages, setMessages] = useState(initialMessages);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    setMessages(initialMessages);
    
    // Auto-scroll to bottom when new messages come
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [initialMessages, autoScroll]);

  // Check if user has scrolled up (disable auto-scroll)
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px margin
    
    setAutoScroll(isAtBottom);
  };

  const handleMessageExpired = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (onMessageExpired) {
      onMessageExpired(messageId);
    }
  };

  const handleEdit = (message: DecryptedMessage) => {
    if (onEditMessage) {
      console.log("Editing message in MessageList:", message.id);
      onEditMessage(message);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete && onDeleteMessage) {
      console.log("Confirming deletion of message:", confirmDelete);
      try {
        await onDeleteMessage(confirmDelete);
        
        // After successful deletion, update local state to reflect the change immediately
        setMessages(prev => 
          prev.map(msg => 
            msg.id === confirmDelete 
              ? {...msg, is_deleted: true, deleted_at: new Date().toISOString()} 
              : msg
          )
        );
        
        toast({
          title: "Melding slettet",
          description: "Meldingen ble slettet",
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        toast({
          title: "Feil",
          description: "Kunne ikke slette meldingen",
          variant: "destructive",
        });
      }
      setConfirmDelete(null);
    }
  };

  const isUserMessage = (message: DecryptedMessage) => {
    return message.sender.id === currentUserId;
  };

  // Function to group messages from same sender
  const groupMessages = () => {
    const groups: DecryptedMessage[][] = [];
    let currentGroup: DecryptedMessage[] = [];

    messages.forEach((message, index) => {
      if (index === 0 || currentGroup.length === 0) {
        currentGroup.push(message);
      } else {
        const prevMessage = currentGroup[currentGroup.length - 1];
        const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
        const sameUser = message.sender.id === prevMessage.sender.id;
        
        // Group messages if they are from same user and not more than 5 minutes apart
        if (sameUser && timeDiff < 5 * 60 * 1000) {
          currentGroup.push(message);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [message];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const messageGroups = groupMessages();

  return (
    <ScrollArea 
      className="h-full px-2 sm:px-4 py-2 sm:py-4"
      onScrollCapture={handleScroll}
      ref={scrollAreaRef}
    >
      <Alert className="mb-4 bg-cyberdark-800/50 border-cybergold-500/30">
        <AlertDescription className="text-xs text-cybergold-300 flex items-center">
          <Clock className="h-3 w-3 mr-1" /> 
          Alle meldinger slettes automatisk etter 24 timer.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-2 sm:space-y-4">
        {messageGroups.map((group, groupIndex) => (
          <MessageGroup
            key={`group-${groupIndex}-${group[0].id}`}
            messages={group}
            isCurrentUser={isUserMessage(group[0])}
            onMessageExpired={handleMessageExpired}
            onEdit={handleEdit}
            onDelete={(messageId) => setConfirmDelete(messageId)}
          />
        ))}
        <div ref={messagesEndRef} />
        
        {!autoScroll && (
          <Button
            className="fixed bottom-20 right-8 bg-cybergold-500 text-black shadow-lg rounded-full p-2 z-10"
            size="sm"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setAutoScroll(true);
            }}
          >
            Scroll ned
          </Button>
        )}
      </div>
      
      <DeleteMessageDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </ScrollArea>
  );
};
