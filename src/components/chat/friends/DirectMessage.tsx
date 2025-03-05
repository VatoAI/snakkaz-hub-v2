
import { Friend } from "./types";
import { DecryptedMessage } from "@/types/message";
import { WebRTCManager } from "@/utils/webrtc";
import { DirectMessageHeader } from "./DirectMessageHeader";
import { DirectMessageEmptyState } from "./DirectMessageEmptyState";
import { DirectMessageList } from "./DirectMessageList";
import { DirectMessageForm } from "./DirectMessageForm";
import { useDirectMessage } from "./hooks/useDirectMessage";

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
  const friendId = friend.user_id === currentUserId ? friend.friend_id : friend.user_id;
  const friendProfile = friend.profile || userProfiles[friendId];
  const username = friendProfile?.username || 'Ukjent bruker';
  const avatarUrl = friendProfile?.avatar_url;

  // Filter messages for this direct chat
  const chatMessages = messages.filter(msg => 
    (msg.sender.id === friendId && !msg.receiver_id) || 
    (msg.sender.id === currentUserId && msg.receiver_id === friendId) || 
    (msg.sender.id === friendId && msg.receiver_id === currentUserId)
  );

  const {
    newMessage,
    setNewMessage,
    isLoading,
    connectionState,
    dataChannelState,
    usingServerFallback,
    connectionAttempts,
    sendError,
    handleSendMessage,
    handleReconnect,
    peerIsTyping,
    isMessageRead
  } = useDirectMessage(friend, currentUserId, webRTCManager, onNewMessage, chatMessages);

  const isSecureConnection = (connectionState === 'connected' && dataChannelState === 'open') || usingServerFallback;

  return (
    <div className="flex flex-col h-full bg-cyberdark-950">
      <DirectMessageHeader 
        friend={friend}
        username={username}
        avatarUrl={avatarUrl}
        connectionState={connectionState}
        dataChannelState={dataChannelState}
        usingServerFallback={usingServerFallback}
        connectionAttempts={connectionAttempts}
        onBack={onBack}
        onReconnect={handleReconnect}
        isTyping={peerIsTyping}
      />
      
      {chatMessages.length === 0 && isSecureConnection ? (
        <DirectMessageEmptyState usingServerFallback={usingServerFallback} />
      ) : (
        <DirectMessageList 
          messages={chatMessages} 
          currentUserId={currentUserId}
          peerIsTyping={peerIsTyping}
          isMessageRead={isMessageRead}
          connectionState={connectionState}
          dataChannelState={dataChannelState}
          usingServerFallback={usingServerFallback}
        />
      )}
      
      <DirectMessageForm 
        usingServerFallback={usingServerFallback}
        sendError={sendError}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        newMessage={newMessage}
        onChangeMessage={setNewMessage}
        connectionState={connectionState}
        dataChannelState={dataChannelState}
      />
    </div>
  );
};
