
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatTabs } from "@/components/chat/ChatTabs";
import { useAuthState } from "@/hooks/useAuthState";
import { useWebRTC } from "@/hooks/useWebRTC";

const Chat = () => {
  const { user } = useAuthState();
  const navigate = useNavigate();
  const { manager: webRTCManager, setupWebRTC, status } = useWebRTC();
  const [isReady, setIsReady] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Set up WebRTC when component mounts
  useEffect(() => {
    if (user && !isReady) {
      setupWebRTC(user.id, () => {
        console.log("WebRTC setup complete");
        setIsReady(true);
      });
    }
  }, [user, setupWebRTC, isReady]);

  // Show loading until authentication and WebRTC are ready
  if (!user || !isReady) {
    return (
      <div className="min-h-screen bg-cyberdark-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-cyberblue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyberblue-400">Laster inn SnakkaZ Chat...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-cyberdark-950 text-white flex flex-col">
      <ChatHeader />
      <div className="flex-1 overflow-hidden">
        <ChatTabs webRTCManager={webRTCManager} />
      </div>
    </div>
  );
};

export default Chat;
