
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Friend } from './types';
import { WebRTCManager } from '@/utils/webrtc';
import { DecryptedMessage } from '@/types/message';
import { supabase } from '@/integrations/supabase/client';
import { encryptMessage } from '@/utils/encryption';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DirectMessageProps {
  friend: Friend;
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  onBack: () => void;
  messages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
  userProfiles?: Record<string, {username: string | null, avatar_url: string | null}>;
}

export const DirectMessage = ({
  friend,
  currentUserId,
  webRTCManager,
  onBack,
  messages,
  onNewMessage,
  userProfiles = {}
}: DirectMessageProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionChange, setLastConnectionChange] = useState(Date.now());
  const [debugInfo, setDebugInfo] = useState<{connectionState: string, dataChannelState: string} | null>(null);
  const connectionStableTimeout = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
  
  // Get friend profile info from either friend object or userProfiles
  const friendProfile = friend.profile || userProfiles[friendId];
  const friendUsername = friendProfile?.username || 'Ukjent venn';
  const friendAvatar = friendProfile?.avatar_url;

  // Filter messages to show only those between current user and this friend
  const directMessages = messages.filter(msg => 
    (msg.sender.id === currentUserId && msg.receiver_id === friendId) ||
    (msg.sender.id === friendId && msg.receiver_id === currentUserId)
  );

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  // Stabilize connection status updates
  useEffect(() => {
    // Clear any existing timer when connection status changes
    if (connectionStableTimeout.current) {
      clearTimeout(connectionStableTimeout.current);
    }
    
    const now = Date.now();
    // If status is changing too rapidly (within 3 seconds), increment counter
    if (now - lastConnectionChange < 3000) {
      setConnectionAttempts(prev => prev + 1);
    }
    
    setLastConnectionChange(now);
    
    // If we've had more than 3 rapid changes, stabilize on a "failed" state
    if (connectionAttempts > 3) {
      setConnectionStatus('failed');
      toast({
        title: "Tilkoblingsproblemer",
        description: "Kunne ikke etablere en stabil tilkobling. Meldinger vil sendes via server.",
        variant: "destructive",
      });
      return;
    }
    
    // Set a timer to consider the connection stable after 5 seconds without changes
    connectionStableTimeout.current = setTimeout(() => {
      setConnectionAttempts(0);
    }, 5000);
    
    return () => {
      if (connectionStableTimeout.current) {
        clearTimeout(connectionStableTimeout.current);
      }
    };
  }, [connectionStatus, lastConnectionChange, connectionAttempts, toast]);

  // Check connection status periodically
  useEffect(() => {
    if (!webRTCManager || !friendId) return;
    
    const checkConnectionStatus = () => {
      if (webRTCManager) {
        const connectionState = webRTCManager.getConnectionState(friendId);
        const dataChannelState = webRTCManager.getDataChannelState(friendId);
        
        setDebugInfo({ connectionState, dataChannelState });
        
        if (dataChannelState === 'open' && connectionState === 'connected') {
          setConnectionStatus('connected');
        } else if (connectionState === 'failed' || connectionState === 'closed') {
          setConnectionStatus('failed');
        } else if (connectionState === 'connecting' || connectionState === 'new') {
          setConnectionStatus('connecting');
        } else {
          setConnectionStatus('disconnected');
        }
      }
    };
    
    // Initial check
    checkConnectionStatus();
    
    // Set up interval to check connection status
    connectionCheckInterval.current = setInterval(checkConnectionStatus, 2000);
    
    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, [webRTCManager, friendId]);

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
          
          console.log('Message sent via WebRTC');
          
          // Get current user's profile info
          const myUsername = userProfiles[currentUserId]?.username || 'Du';
          const myAvatar = userProfiles[currentUserId]?.avatar_url;
          
          // Add the message to the UI immediately
          const outgoingMessage: DecryptedMessage = {
            id: messageId,
            content: message,
            created_at: timestamp,
            encryption_key: '',
            iv: '',
            sender: {
              id: currentUserId,
              username: myUsername,
              full_name: null,
              avatar_url: myAvatar
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
        console.log('Falling back to server for message delivery');
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
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
          <span>Kobler til...</span>
        </div>
      );
    } else if (connectionStatus === 'failed') {
      return (
        <div className="flex items-center gap-1 text-xs text-red-400">
          <div className="h-2 w-2 rounded-full bg-red-400"></div>
          <span>Tilkobling feilet</span>
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
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-cybergold-500/30">
                {friendAvatar ? (
                  <AvatarImage 
                    src={supabase.storage.from('avatars').getPublicUrl(friendAvatar).data.publicUrl} 
                    alt={friendUsername}
                  />
                ) : (
                  <AvatarFallback className="bg-cybergold-500/20 text-cybergold-300">
                    {friendUsername.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <h3 className="text-cybergold-300 font-medium">{friendUsername}</h3>
            </div>
          </div>
          {renderConnectionStatus()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {directMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-cybergold-500">
            <div className="bg-cyberdark-800/40 p-6 rounded-xl mb-4">
              <ShieldCheck className="h-10 w-10 text-cybergold-400/50 mx-auto mb-4" />
              <p className="text-sm mb-2">
                Ingen meldinger ennå. Send en melding for å starte samtalen.
              </p>
              <p className="text-xs opacity-70">
                Meldinger sendes med ende-til-ende-kryptering når begge er pålogget.
              </p>
            </div>
          </div>
        ) : (
          directMessages.map(msg => {
            const isCurrentUser = msg.sender.id === currentUserId;
            const senderAvatar = isCurrentUser 
              ? userProfiles[currentUserId]?.avatar_url 
              : friendAvatar;
            const senderName = isCurrentUser 
              ? userProfiles[currentUserId]?.username || 'Du' 
              : friendUsername;
              
            return (
              <div 
                key={msg.id}
                className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="w-8 h-8 mt-1">
                  {senderAvatar ? (
                    <AvatarImage 
                      src={supabase.storage.from('avatars').getPublicUrl(senderAvatar).data.publicUrl} 
                      alt={senderName}
                    />
                  ) : (
                    <AvatarFallback className="bg-cybergold-500/20 text-cybergold-300">
                      {senderName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div 
                  className={`max-w-[75%] p-3 rounded-md ${
                    isCurrentUser 
                      ? 'bg-cybergold-500/20 text-cybergold-100'
                      : 'bg-cyberdark-700 text-cyberblue-100'
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className="text-xs opacity-50 block mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {connectionStatus === 'failed' && (
        <div className="px-4 py-2 bg-red-900/20 border-t border-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-300">
            Direkte tilkobling mislyktes. Meldinger sendes via server med 5 minutters utløpstid.
          </span>
        </div>
      )}

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
      
      {/* Debug info - skjult i produksjon, kan vises for debugging */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div className="p-2 border-t border-gray-800 text-xs text-gray-500">
          <p>Connection: {debugInfo.connectionState}</p>
          <p>DataChannel: {debugInfo.dataChannelState}</p>
        </div>
      )}
    </div>
  );
};
