import { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/router';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from "@/components/ui/use-toast"
import { useWebRTC } from '@/hooks/useWebRTC';
import { OnlineUsers } from '@/components/OnlineUsers';

const Chat = () => {
  const { supabaseClient } = useUser();
  const { toast } = useToast()
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { userId, webRTCManager, peerId } = useWebRTC(setOnlineUsers);

  useEffect(() => {
    if (!userId) return;
    console.log("Din unike PeerJS ID:", userId);
  }, [userId]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session) {
        setAuthLoading(false);
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [supabaseClient, router]);

  const { 
    messages, 
    newMessage, 
    setNewMessage, 
    isLoading, 
    ttl, 
    setTtl, 
    fetchMessages, 
    setupRealtimeSubscription,
    addP2PMessage, 
    handleSendMessage,
    handleMessageExpired
  } = useMessages(userId);

  useEffect(() => {
    if (userId) {
      fetchMessages();
      const unsubscribe = setupRealtimeSubscription();
      return () => unsubscribe();
    }
  }, [userId, fetchMessages, setupRealtimeSubscription]);

  useEffect(() => {
    if (webRTCManager) {
      webRTCManager.on('message', (peerId, message) => {
        addP2PMessage(message, peerId);
      });
    }
  }, [webRTCManager, addP2PMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (webRTCManager && userId) {
      await handleSendMessage(webRTCManager, onlineUsers);
    } else {
      toast({
        title: "WebRTC ikke initialisert",
        description: "Prøv å laste siden på nytt",
        variant: "destructive",
      })
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-cyberdark-900">
      <div className="p-4 border-b border-cybergold-500/30 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cybergold-200">CyberChat 2077</h1>
        <OnlineUsers onlineUsers={onlineUsers} peerId={peerId} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          onMessageExpired={handleMessageExpired}
        />
      </div>

      <div className="p-4 border-t border-cybergold-500/30">
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          ttl={ttl}
          setTtl={setTtl}
        />
      </div>
    </div>
  );
};

export default Chat;
