
import { useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { useMessages } from "@/hooks/useMessages";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const auth = useAuthState();
  const messages = useMessages(auth.userId);
  const webRTC = useWebRTC(auth.userId, messages.addP2PMessage);
  
  useEffect(() => {
    const initializeChat = async () => {
      const userId = await auth.checkAuth();
      if (userId) {
        const rtcManager = webRTC.initializeWebRTC(userId);
        await messages.fetchMessages();
        messages.setupRealtimeSubscription();
        webRTC.setupPresenceChannel(userId);
      }
    };
    
    initializeChat();

    return () => {
      if (webRTC.webRTCManager) {
        webRTC.webRTCManager.disconnectAll();
      }
    };
  }, []);

  if (auth.showMagicLinkForm) {
    return (
      <LoginForm 
        email={auth.email}
        setEmail={auth.setEmail}
        onSubmit={auth.handleMagicLinkLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-50 via-background to-theme-50 flex flex-col">
      <div className="flex-1 container mx-auto max-w-4xl p-4 flex flex-col h-[calc(100vh-2rem)]">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-theme-900">SnakkaZ</h1>
              <p className="text-sm text-gray-600">
                {webRTC.onlineUsers.size} online {webRTC.onlineUsers.size === 1 ? 'bruker' : 'brukere'}
              </p>
            </div>
            <Button 
              onClick={auth.handleSignOut}
              variant="outline"
              className="text-theme-600 hover:text-theme-700"
            >
              Logg ut
            </Button>
          </div>
          <MessageList messages={messages.messages} />
          <MessageInput 
            newMessage={messages.newMessage}
            setNewMessage={messages.setNewMessage}
            onSubmit={(e) => {
              e.preventDefault();
              messages.handleSendMessage(webRTC.webRTCManager, webRTC.onlineUsers);
            }}
            isLoading={messages.isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
