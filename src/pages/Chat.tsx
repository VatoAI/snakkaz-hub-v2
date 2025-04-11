
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatTabs } from "@/components/chat/ChatTabs";
import { useAuthState } from "@/hooks/useAuthState";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/components/ui/use-toast";
import { useMessages } from "@/hooks/useMessages";
import { ChatFriends } from "@/components/chat/ChatFriends";
import { useChatState } from "@/components/chat/hooks/useChatState";
import { UserStatus } from "@/types/presence";

const Chat = () => {
  const { userId, checkAuth } = useAuthState();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { manager: webRTCManager, setupWebRTC, status } = useWebRTC();
  
  const {
    authLoading,
    setAuthLoading,
    userPresence,
    setUserPresence,
    currentStatus,
    setCurrentStatus,
    directMessages,
    setDirectMessages,
    friendsList,
    setFriendsList,
    hidden,
    setHidden,
    activeChat,
    setActiveChat,
    friends,
    setFriends,
    selectedFriend,
    setSelectedFriend,
    userProfiles,
    setUserProfiles,
    activeTab,
    setActiveTab,
  } = useChatState();

  // Set up messages hook for global chat
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
    handleMessageExpired,
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleDeleteMessage
  } = useMessages(userId);

  // Check authentication when component mounts
  useEffect(() => {
    const verifyAuth = async () => {
      const currentUserId = await checkAuth();
      if (!currentUserId) {
        navigate('/login');
      }
      setAuthLoading(false);
    };
    
    verifyAuth();
  }, [checkAuth, navigate, setAuthLoading]);

  // Set up WebRTC when component mounts and user is authenticated
  useEffect(() => {
    if (userId && !webRTCManager) {
      setupWebRTC(userId, () => {
        console.log("WebRTC setup complete");
      });
    }
  }, [userId, setupWebRTC, webRTCManager]);

  // Fetch messages when component mounts
  useEffect(() => {
    if (userId) {
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [userId, fetchMessages, setupRealtimeSubscription]);

  // Handle message reception from WebRTC
  useEffect(() => {
    if (webRTCManager) {
      webRTCManager.onMessage((content, senderId) => {
        console.log(`Received message from ${senderId}: ${content}`);
        const senderName = userProfiles[senderId]?.username || "Unknown User";
        
        const newMsg = {
          id: `p2p-${Date.now()}`,
          content,
          sender: {
            id: senderId,
            username: senderName,
            full_name: null,
            avatar_url: userProfiles[senderId]?.avatar_url
          },
          created_at: new Date().toISOString(),
          encryption_key: '',
          iv: '',
          is_encrypted: true
        };
        
        addP2PMessage(newMsg);
      });
    }
  }, [webRTCManager, userProfiles, addP2PMessage]);

  const handleCloseDirectChat = () => {
    setSelectedFriend(null);
    setActiveTab("global");
  };

  const onStartChat = (friendId: string) => {
    const friend = friends.find(f => 
      (f.user_id === friendId && f.friend_id === userId) || 
      (f.friend_id === friendId && f.user_id === userId)
    );
    
    if (friend) {
      setSelectedFriend(friend);
      setActiveTab("direct");
    }
  };

  const handleNewMessage = (message: any) => {
    setDirectMessages(prev => [...prev, message]);
  };

  const handleSubmit = async (e: React.FormEvent, mediaFile?: File) => {
    e.preventDefault();
    
    try {
      if (webRTCManager) {
        const onlineUsers = new Set<string>(Object.keys(userPresence));
        await handleSendMessage(webRTCManager, onlineUsers, mediaFile);
      } else {
        await handleSendMessage(null, new Set(), mediaFile);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding",
        variant: "destructive",
      });
    }
  };

  // Show loading until authentication verification is complete
  if (authLoading) {
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
      <ChatHeader 
        userPresence={userPresence}
        currentUserId={userId}
        currentStatus={currentStatus as UserStatus}
        onStatusChange={setCurrentStatus}
        webRTCManager={webRTCManager}
        directMessages={directMessages}
        onNewMessage={handleNewMessage}
        onStartChat={onStartChat}
        userProfiles={userProfiles}
      />
      
      {/* Hidden component for managing friends data */}
      <ChatFriends
        userId={userId}
        setFriends={setFriends}
        setFriendsList={setFriendsList}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        setSelectedFriend={setSelectedFriend}
      />
      
      <div className="flex-1 overflow-hidden">
        <ChatTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedFriend={selectedFriend}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isLoading={isLoading}
          ttl={ttl}
          setTtl={setTtl}
          onMessageExpired={handleMessageExpired}
          onSubmit={handleSubmit}
          currentUserId={userId}
          editingMessage={editingMessage}
          onEditMessage={handleStartEditMessage}
          onCancelEdit={handleCancelEditMessage}
          onDeleteMessage={handleDeleteMessage}
          directMessages={directMessages}
          onNewMessage={handleNewMessage}
          webRTCManager={webRTCManager}
          userProfiles={userProfiles}
          handleCloseDirectChat={handleCloseDirectChat}
        />
      </div>
    </div>
  );
};

export default Chat;
