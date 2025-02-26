
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Friend } from './types';
import { WebRTCManager } from '@/utils/webrtc';
import { DecryptedMessage } from '@/types/message';

interface DirectMessageProps {
  friend: Friend;
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  onBack: () => void;
  messages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
}

export const DirectMessage = ({
  friend,
  currentUserId,
  webRTCManager,
  onBack,
  messages,
  onNewMessage
}: DirectMessageProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
  const friendUsername = friend.profile?.username || 'Ukjent venn';

  // Filter messages to show only those between current user and this friend
  const directMessages = messages.filter(msg => 
    (msg.sender.id === currentUserId && msg.receiver_id === friendId) ||
    (msg.sender.id === friendId && msg.receiver_id === currentUserId)
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !webRTCManager || !currentUserId) return;
    
    setIsLoading(true);
    
    try {
      // Attempt to send via WebRTC
      try {
        await webRTCManager.sendDirectMessage(friendId, message);
        toast({
          title: 'Sendt',
          description: 'Melding sendt direkte'
        });
      } catch (error) {
        console.error('WebRTC send error:', error);
        // Fall back to server
        toast({
          title: 'Bruker direktemeldingstjenesten',
          description: 'Melding sendt via server'
        });
      }
      
      // Clear the input field
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke sende melding',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-cybergold-500/30 p-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="text-cybergold-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-cybergold-300 font-medium">{friendUsername}</h3>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {directMessages.length === 0 ? (
          <p className="text-center text-cybergold-500 text-sm">
            Ingen meldinger ennå. Send en melding for å starte samtalen.
          </p>
        ) : (
          directMessages.map(msg => (
            <div 
              key={msg.id}
              className={`max-w-[80%] p-3 rounded-md ${
                msg.sender.id === currentUserId 
                  ? 'ml-auto bg-cybergold-500/20 text-cybergold-100'
                  : 'mr-auto bg-cyberdark-700 text-cyberblue-100'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-50 block mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-cybergold-500/30">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Skriv en kryptert melding..."
            className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100"
            disabled={isLoading}
          />
          <Button 
            type="submit"
            disabled={!message.trim() || isLoading}
            className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
