
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Friend } from './types';
import { WebRTCManager } from '@/utils/webrtc';
import { DecryptedMessage } from '@/types/message';
import { supabase } from '@/integrations/supabase/client';
import { encryptMessage } from '@/utils/encryption';

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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
  const friendUsername = friend.profile?.username || 'Ukjent venn';

  // Filter messages to show only those between current user and this friend
  const directMessages = messages.filter(msg => 
    (msg.sender.id === currentUserId && msg.receiver_id === friendId) ||
    (msg.sender.id === friendId && msg.receiver_id === currentUserId)
  );

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  // Attempt to establish P2P connection when component mounts
  useEffect(() => {
    if (!webRTCManager || !friendId) return;

    const connectToFriend = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Check if we can get the friend's WebRTC public key from presence channel
        const { data, error } = await supabase
          .from('user_presence')
          .select('last_seen')
          .eq('user_id', friendId)
          .single();

        if (error) {
          console.error('Error checking friend presence:', error);
          setConnectionStatus('disconnected');
          return;
        }

        // If friend was seen in the last 5 minutes, try to establish connection
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        if (new Date(data.last_seen) > fiveMinutesAgo) {
          try {
            const publicKey = webRTCManager.getPublicKey();
            if (publicKey) {
              await webRTCManager.connectToPeer(friendId, publicKey);
              setConnectionStatus('connected');
              toast({
                title: "Tilkoblet",
                description: "Sikker P2P-forbindelse opprettet",
              });
            }
          } catch (error) {
            console.error('Failed to establish P2P connection:', error);
            setConnectionStatus('failed');
          }
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (error) {
        console.error('Error in connectToFriend:', error);
        setConnectionStatus('failed');
      }
    };

    connectToFriend();

    return () => {
      if (webRTCManager) {
        webRTCManager.disconnect(friendId);
      }
    };
  }, [webRTCManager, friendId, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId) return;
    
    setIsLoading(true);
    
    try {
      // Create a new message object
      const timestamp = new Date().toISOString();
      const messageId = `dm-${Date.now()}`;
      
      let isSentP2P = false;
      
      // First try to send via WebRTC if connected
      if (webRTCManager && connectionStatus === 'connected') {
        try {
          await webRTCManager.sendDirectMessage(friendId, message);
          isSentP2P = true;
          
          // Add the message to the UI immediately
          const outgoingMessage: DecryptedMessage = {
            id: messageId,
            content: message,
            created_at: timestamp,
            encryption_key: '',
            iv: '',
            sender: {
              id: currentUserId,
              username: 'Du', // Could be replaced with actual username
              full_name: null,
              avatar_url: null
            },
            receiver_id: friendId
          };
          
          onNewMessage(outgoingMessage);
          
        } catch (error) {
          console.error('WebRTC send error:', error);
          isSentP2P = false;
        }
      }
      
      // If P2P fails or not available, fall back to server
      if (!isSentP2P) {
        const { encryptedContent, key, iv } = await encryptMessage(message);
        
        const { error } = await supabase
          .from('messages')
          .insert({
            encrypted_content: encryptedContent,
            encryption_key: key,
            iv: iv,
            sender_id: currentUserId,
            receiver_id: friendId,
            ephemeral_ttl: 300 // Messages expire after 5 minutes
          });
          
        if (error) {
          throw error;
        }
        
        toast({
          title: 'Melding sendt',
          description: 'Bruker serveren som backup (meldingen utløper om 5 minutter)',
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

  // Render connection status indicator
  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') {
      return (
        <div className="flex items-center gap-1 text-xs text-green-400">
          <ShieldCheck className="h-3 w-3" />
          <span>E2EE Aktiv</span>
        </div>
      );
    } else if (connectionStatus === 'connecting') {
      return (
        <div className="flex items-center gap-1 text-xs text-yellow-400">
          <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span>Kobler til...</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          <span>Fallback-modus</span>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-cybergold-500/30 p-2">
        <div className="flex items-center justify-between">
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
          {renderConnectionStatus()}
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
        <div ref={messagesEndRef} />
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
