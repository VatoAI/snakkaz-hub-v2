import { useState, useEffect, useRef } from "react";
import { Friend } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, RefreshCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DecryptedMessage } from "@/types/message";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { WebRTCManager } from "@/utils/webrtc";

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
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [dataChannelState, setDataChannelState] = useState<string>("connecting");
  const [usingServerFallback, setUsingServerFallback] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
  
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);

  const chatMessages = messages.filter(msg => 
    (msg.sender.id === friendId && !msg.receiver_id) || 
    (msg.sender.id === currentUserId && msg.receiver_id === friendId) || 
    (msg.sender.id === friendId && msg.receiver_id === currentUserId)
  );

  const friendProfile = friend.profile || userProfiles[friendId];
  const username = friendProfile?.username || 'Ukjent bruker';
  const avatarUrl = friendProfile?.avatar_url;

  useEffect(() => {
    if (!webRTCManager || !friendId) return;

    updateConnectionStatus();
    
    statusCheckInterval.current = setInterval(() => {
      updateConnectionStatus();
    }, 2000);

    connectionTimeout.current = setTimeout(() => {
      const connState = webRTCManager.getConnectionState(friendId);
      const dataState = webRTCManager.getDataChannelState(friendId);
      
      if (connState !== 'connected' || dataState !== 'open') {
        console.log('Falling back to server for message delivery');
        setUsingServerFallback(true);
        toast({
          title: "Direkte tilkobling mislyktes",
          description: "Meldinger sendes via server med ende-til-ende-kryptering.",
        });
      }
    }, 10000);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
    };
  }, [webRTCManager, friendId, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const updateConnectionStatus = () => {
    if (!webRTCManager || !friendId) return;
    
    const connState = webRTCManager.getConnectionState(friendId);
    const dataState = webRTCManager.getDataChannelState(friendId);
    
    setConnectionState(connState);
    setDataChannelState(dataState);
    
    if (connState === 'connected' && dataState === 'open') {
      setUsingServerFallback(false);
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
        connectionTimeout.current = null;
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !friendId || !currentUserId) return;
    
    setIsLoading(true);
    try {
      let messageDelivered = false;
      
      const localMessage: DecryptedMessage = {
        id: `local-${Date.now()}`,
        content: newMessage,
        sender: {
          id: currentUserId,
          username: null,
          full_name: null
        },
        receiver_id: friendId,
        created_at: new Date().toISOString(),
        encryption_key: '',
        iv: '',
        is_encrypted: true
      };
      
      if (webRTCManager && !usingServerFallback) {
        try {
          const connState = webRTCManager.getConnectionState(friendId);
          const dataState = webRTCManager.getDataChannelState(friendId);
          
          if (connState === 'connected' && dataState === 'open') {
            await webRTCManager.sendDirectMessage(friendId, newMessage);
            messageDelivered = true;
          } else {
            console.log(`Connection not ready (${connState}/${dataState}), trying to reconnect`);
            await webRTCManager.attemptReconnect(friendId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const newConnState = webRTCManager.getConnectionState(friendId);
            const newDataState = webRTCManager.getDataChannelState(friendId);
            
            if (newConnState === 'connected' && newDataState === 'open') {
              await webRTCManager.sendDirectMessage(friendId, newMessage);
              messageDelivered = true;
            } else {
              console.log(`Reconnect failed (${newConnState}/${newDataState}), falling back to server`);
              setUsingServerFallback(true);
            }
          }
        } catch (error) {
          console.error('Error sending P2P message:', error);
          setUsingServerFallback(true);
        }
      }
      
      if (!messageDelivered) {
        const { error } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUserId,
            receiver_id: friendId,
            encrypted_content: newMessage,
            is_encrypted: true
          });
        
        if (error) {
          throw error;
        }
        
        messageDelivered = true;
        console.log('Message sent via server');
      }
      
      if (messageDelivered) {
        onNewMessage(localMessage);
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!webRTCManager || !friendId) return;
    
    setConnectionAttempts(prev => prev + 1);
    setUsingServerFallback(false);
    
    toast({
      title: "Kobler til...",
      description: "Forsøker å etablere direkte tilkobling.",
    });
    
    try {
      await webRTCManager.attemptReconnect(friendId);
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      connectionTimeout.current = setTimeout(() => {
        const connState = webRTCManager.getConnectionState(friendId);
        const dataState = webRTCManager.getDataChannelState(friendId);
        
        if (connState !== 'connected' || dataState !== 'open') {
          setUsingServerFallback(true);
          toast({
            title: "Direkte tilkobling mislyktes",
            description: "Meldinger sendes via server med ende-til-ende-kryptering.",
          });
        }
      }, 5000);
    } catch (error) {
      console.error('Error reconnecting:', error);
      setUsingServerFallback(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cyberdark-950">
      <div className="flex items-center gap-2 border-b border-cybergold-500/30 p-3 bg-cyberdark-900">
        <Button 
          onClick={onBack}
          size="icon" 
          variant="ghost" 
          className="text-cybergold-300 hover:text-cybergold-200 hover:bg-cyberdark-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8 mr-2">
          {avatarUrl ? (
            <AvatarImage 
              src={supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl}
              alt={username} 
            />
          ) : (
            <AvatarFallback className="bg-cybergold-500/20 text-cybergold-300">
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-1">
          <h2 className="text-cybergold-200 font-medium">{username}</h2>
          <div className="flex items-center text-xs">
            <span 
              className={`w-2 h-2 rounded-full mr-1 ${
                connectionState === 'connected' && dataChannelState === 'open'
                  ? 'bg-green-500'
                  : connectionState === 'connecting' || dataChannelState === 'connecting'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            ></span>
            <span className="text-cyberdark-400">
              {connectionState === 'connected' && dataChannelState === 'open'
                ? 'Tilkoblet direkte'
                : usingServerFallback
                ? 'Bruker server'
                : `Connection: ${connectionState}, DataChannel: ${dataChannelState}`}
            </span>
            
            {(connectionState !== 'connected' || dataChannelState !== 'open') && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 ml-1 text-cybergold-400 hover:text-cybergold-300"
                onClick={handleReconnect}
                disabled={connectionAttempts > 3}
                title="Forsøk å koble til igjen"
              >
                <RefreshCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-cyberdark-400">
            <div className="mb-2 p-3 bg-cyberdark-800/30 rounded-full">
              <svg className="h-8 w-8 text-cybergold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p>Ingen meldinger ennå. Send en melding for å starte samtalen.</p>
            {usingServerFallback && (
              <p className="mt-2 text-sm text-amber-400">Bruker ende-til-ende-kryptering via server.</p>
            )}
          </div>
        ) : (
          chatMessages.map((message) => (
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-cybergold-500/30 bg-cyberdark-900">
        {usingServerFallback && (
          <Alert className="mb-2 bg-amber-900/20 border-amber-700 text-amber-300 py-2">
            <AlertDescription className="text-xs">
              Direkte tilkobling mislyktes. Meldinger sendes via server med ende-til-ende-kryptering.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv en kryptert melding..."
            className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !newMessage.trim()}
            className="bg-cybergold-500 hover:bg-cybergold-600 text-black"
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
