import { useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useChatAuth } from '@/components/chat/ChatAuth';
import { useMessageP2P } from '@/hooks/message/useMessageP2P';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatTabs } from '@/components/chat/ChatTabs';
import { useChatState } from '@/components/chat/hooks/useChatState';
import { useUserProfiles } from '@/components/chat/hooks/useUserProfiles';
import { useFriends } from '@/components/chat/hooks/useFriends';
import { usePresence } from '@/components/chat/hooks/usePresence';

const Chat = () => {
  const {
    authLoading, setAuthLoading,
    userId, setUserId,
    userPresence, setUserPresence,
    currentStatus, setCurrentStatus,
    directMessages, setDirectMessages,
    hidden, setHidden,
    activeChat, setActiveChat,
    selectedFriend, setSelectedFriend,
    activeTab, setActiveTab,
    toast
  } = useChatState();
  
  const { userProfiles } = useUserProfiles();
  const { addP2PMessage } = useMessageP2P(setDirectMessages);
  
  const { webRTCManager, setupPresenceChannel, initializeWebRTC } = useWebRTC(userId, () => {
    addP2PMessage();
  });

  const { friends, friendsList, handleSendFriendRequest, handleStartChat } = useFriends(
    userId, 
    activeChat, 
    setActiveChat, 
    setSelectedFriend
  );

  const { handleStatusChange } = usePresence(
    userId, 
    currentStatus, 
    setUserPresence, 
    hidden
  );

  useChatAuth({
    setUserId,
    setAuthLoading,
    initializeWebRTC,
    setupPresenceChannel
  });

  const { 
    messages, 
    newMessage, 
    setNewMessage, 
    isLoading, 
    ttl, 
    setTtl, 
    fetchMessages, 
    setupRealtimeSubscription,
    handleSendMessage,
    handleMessageExpired,
    editingMessage,
    handleStartEditMessage,
    handleCancelEditMessage,
    handleDeleteMessage
  } = useMessages(userId);

  useEffect(() => {
    if (userId) {
      console.log("Setting up messages for user:", userId);
      fetchMessages();
      return setupRealtimeSubscription();
    }
  }, [userId, fetchMessages, setupRealtimeSubscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (webRTCManager && userId) {
      let mediaFile: File | undefined;
      if (e.target) {
        const form = e.target as HTMLFormElement;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          mediaFile = fileInput.files[0];
        }
      }

      await handleSendMessage(webRTCManager, new Set(Object.keys(userPresence)), mediaFile);
    } else {
      toast({
        title: "WebRTC ikke initialisert",
        description: "Prøv å laste siden på nytt",
        variant: "destructive",
      });
    }
  };
  
  const handleDirectMessage = (message: any) => {
    setDirectMessages(prev => [...prev, message]);
  };

  const handleToggleHidden = () => {
    setHidden(!hidden);
  };
  
  const handleCloseDirectChat = () => {
    setActiveChat(null);
    setSelectedFriend(null);
    setActiveTab("global");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cyberdark-900">
        <div className="animate-pulse text-cybergold-200">Laster...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-cyberdark-900 max-w-full overflow-hidden">
      <ChatHeader
        userPresence={userPresence}
        currentUserId={userId}
        currentStatus={currentStatus}
        onStatusChange={handleStatusChange}
        webRTCManager={webRTCManager}
        directMessages={directMessages}
        onNewMessage={handleDirectMessage}
        friends={friendsList}
        onSendFriendRequest={handleSendFriendRequest}
        onStartChat={(friendId) => {
          handleStartChat(friendId);
          setActiveTab("direct");
        }}
        hidden={hidden}
        onToggleHidden={handleToggleHidden}
        userProfiles={userProfiles}
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
          onNewMessage={handleDirectMessage}
          webRTCManager={webRTCManager}
          userProfiles={userProfiles}
          handleCloseDirectChat={handleCloseDirectChat}
        />
      </div>
    </div>
  );
};

export default Chat;
