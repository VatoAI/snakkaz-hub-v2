
import { DecryptedMessage } from "@/types/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Timer, Edit, Trash2, MoreVertical, File } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface MessageListProps {
  messages: DecryptedMessage[];
  onMessageExpired?: (messageId: string) => void;
  currentUserId?: string | null;
  onEditMessage?: (message: { id: string; content: string }) => void;
  onDeleteMessage?: (messageId: string) => void;
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
    
    // Auto-scroll til bunnen når nye meldinger kommer
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [initialMessages, autoScroll]);

  // Sjekk om brukeren har scrollet opp (deaktiver auto-scroll)
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
      onEditMessage({ id: message.id, content: message.content });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || !onDeleteMessage) return;
    
    try {
      onDeleteMessage(confirmDelete);
      setConfirmDelete(null);
      toast({
        title: "Slettet",
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
  };

  const renderMedia = (message: DecryptedMessage) => {
    if (!message.media_url) return null;

    const url = supabase.storage.from('chat-media').getPublicUrl(message.media_url).data.publicUrl;
    
    if (message.is_deleted) {
      return (
        <div className="mt-2 p-3 border border-cyberdark-700 rounded-lg bg-cyberdark-900/50 text-center">
          <p className="text-cyberdark-400 text-sm italic">Medie slettet</p>
        </div>
      );
    }

    if (message.media_type?.startsWith('image/')) {
      return (
        <img 
          src={url} 
          alt="Bilde" 
          className="max-w-full h-auto rounded-lg mt-2 max-h-[300px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(url, '_blank')}
        />
      );
    } else if (message.media_type?.startsWith('video/')) {
      return (
        <video 
          controls 
          className="max-w-full h-auto rounded-lg mt-2 max-h-[300px]"
        >
          <source src={url} type={message.media_type} />
          Din nettleser støtter ikke videospilling.
        </video>
      );
    } else if (message.media_type?.startsWith('audio/')) {
      return (
        <audio 
          controls 
          className="max-w-full w-full mt-2"
        >
          <source src={url} type={message.media_type} />
          Din nettleser støtter ikke lydavspilling.
        </audio>
      );
    } else {
      // For dokumenter og andre filer
      return (
        <div className="mt-2 p-3 border border-cyberdark-700 rounded-lg bg-cyberdark-900/50 flex items-center">
          <File className="h-6 w-6 text-cybergold-400 mr-3" />
          <div className="flex-1 min-w-0">
            <p className="text-cybergold-200 text-sm truncate">
              {message.media_url.split('/').pop()}
            </p>
            <p className="text-xs text-cyberdark-400">
              {message.media_type || "Dokument"}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-cybergold-300 hover:text-cybergold-200"
            onClick={() => window.open(url, '_blank')}
          >
            Åpne
          </Button>
        </div>
      );
    }
  };

  const isUserMessage = (message: DecryptedMessage) => {
    return message.sender.id === currentUserId;
  };

  // Funksjon for å gruppere meldinger fra samme avsender
  const groupMessages = () => {
    const groups: DecryptedMessage[][] = [];
    let currentGroup: DecryptedMessage[] = [];

    messages.forEach((message, index) => {
      if (index === 0) {
        currentGroup.push(message);
      } else {
        const prevMessage = messages[index - 1];
        const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
        const sameUser = message.sender.id === prevMessage.sender.id;
        
        // Gruppér meldinger hvis de er fra samme bruker og ikke mer enn 5 minutter mellom
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
      <div className="space-y-2 sm:space-y-4">
        {messageGroups.map((group, groupIndex) => {
          const firstMessage = group[0];
          const isCurrentUser = isUserMessage(firstMessage);
          
          return (
            <div key={`group-${groupIndex}`} className="animate-fadeIn">
              <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-x-2 sm:gap-x-3 max-w-[85%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mt-1">
                    {firstMessage.sender.avatar_url ? (
                      <AvatarImage 
                        src={supabase.storage.from('avatars').getPublicUrl(firstMessage.sender.avatar_url).data.publicUrl} 
                        alt={firstMessage.sender.username || 'Avatar'} 
                      />
                    ) : (
                      <AvatarFallback>
                        <User className="w-4 h-4 text-cybergold-400" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-cybergold-300 mb-1">
                      {firstMessage.sender.full_name || firstMessage.sender.username || 'Anonym'}
                    </p>
                    
                    {group.map((message, messageIndex) => (
                      <div 
                        key={message.id}
                        className={`group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                          isCurrentUser 
                            ? 'bg-cybergold-900/20 hover:bg-cybergold-900/30' 
                            : 'bg-cyberdark-800/50 hover:bg-cyberdark-800/70'
                        } ${messageIndex > 0 ? 'mt-1' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          {message.is_deleted ? (
                            <p className="text-cyberdark-400 italic text-xs sm:text-sm">
                              Denne meldingen ble slettet
                            </p>
                          ) : (
                            <>
                              <p className="text-cyberblue-100 text-xs sm:text-sm break-words">
                                {message.content}
                                {message.is_edited && (
                                  <span className="text-[10px] text-cyberdark-400 ml-1">(redigert)</span>
                                )}
                              </p>
                              {renderMedia(message)}
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] sm:text-xs text-cyberdark-400 group-hover:text-cyberdark-300">
                                  {new Date(message.created_at).toLocaleString()}
                                </p>
                                <MessageTimer 
                                  message={message} 
                                  onExpired={() => handleMessageExpired(message.id)} 
                                />
                              </div>
                            </>
                          )}
                        </div>
                        
                        {isCurrentUser && !message.is_deleted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyberdark-400 hover:text-cyberdark-300"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-cyberdark-800 border-cybergold-500/30">
                              <DropdownMenuItem 
                                className="text-cybergold-300 cursor-pointer flex items-center"
                                onClick={() => handleEdit(message)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Rediger</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-400 cursor-pointer flex items-center"
                                onClick={() => setConfirmDelete(message.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Slett</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
      
      {/* Dialog for å bekrefte sletting */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="bg-cyberdark-900 border-cybergold-500/30">
          <DialogHeader>
            <DialogTitle className="text-cybergold-300">Slett melding</DialogTitle>
            <DialogDescription className="text-cyberdark-300">
              Er du sikker på at du vil slette denne meldingen? Dette kan ikke angres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              className="border-cybergold-500/30 text-cybergold-300"
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-900 hover:bg-red-800 text-white border-none"
            >
              Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
};
