
import { useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { useMessages } from "@/hooks/useMessages";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Dices, Power } from "lucide-react";

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
    <div className="min-h-screen bg-cyberdark-950 flex flex-col">
      <div className="flex-1 container mx-auto max-w-4xl p-4 flex flex-col h-[calc(100vh-2rem)]">
        <div className="bg-cyberdark-900/80 backdrop-blur-lg rounded-lg border border-cybergold-500/30 shadow-lg p-6 flex-1 flex flex-col relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cybergold-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyberblue-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-cyberdark-800 border-2 border-cybergold-500 flex items-center justify-center shadow-neon-gold">
                <Dices className="w-6 h-6 text-cybergold-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cybergold-400 to-cybergold-200 bg-clip-text text-transparent">
                  SnakkaZ
                </h1>
                <p className="text-sm text-cyberblue-300 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-cyberblue-400 animate-pulse mr-2"></span>
                  {webRTC.onlineUsers.size} online {webRTC.onlineUsers.size === 1 ? 'bruker' : 'brukere'}
                </p>
              </div>
            </div>
            <Button 
              onClick={auth.handleSignOut}
              variant="outline"
              className="bg-cyberdark-800 text-cybergold-400 border-cybergold-500/50 hover:bg-cyberdark-700 hover:text-cybergold-300 transition-all duration-300 flex items-center space-x-2"
            >
              <Power className="w-4 h-4" />
              <span>Logg ut</span>
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-cyberdark-800/50 backdrop-blur-sm rounded-lg border border-cybergold-500/20 shadow-lg overflow-hidden">
              <MessageList messages={messages.messages} />
            </div>
          </div>
          
          <div className="mt-4 relative z-10">
            <MessageInput 
              newMessage={messages.newMessage}
              setNewMessage={messages.setNewMessage}
              onSubmit={(e) => {
                e.preventDefault();
                messages.handleSendMessage(webRTC.webRTCManager, webRTC.onlineUsers);
              }}
              isLoading={messages.isLoading}
              ttl={messages.ttl}
              setTtl={messages.setTtl}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
