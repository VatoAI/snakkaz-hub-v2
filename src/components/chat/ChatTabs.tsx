
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DecryptedMessage } from "@/types/message";
import { ChatGlobal } from "./ChatGlobal";
import { DirectMessage } from "./friends/DirectMessage";
import { Friend } from "./friends/types";
import { WebRTCManager } from "@/utils/webrtc";

interface ChatTabsProps {
  messages: DecryptedMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  isLoading: boolean;
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  onMessageExpired: (messageId: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  selectedFriend: Friend | null;
  onCloseDirectChat: () => void;
  directMessages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  userProfiles: Record<string, {username: string | null, avatar_url: string | null}>;
  editingMessage: { id: string; content: string } | null;
  onEditMessage: (message: { id: string; content: string }) => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
}

export const ChatTabs = ({
  messages,
  newMessage,
  setNewMessage,
  isLoading,
  ttl,
  setTtl,
  onMessageExpired,
  onSubmit,
  selectedFriend,
  onCloseDirectChat,
  directMessages,
  onNewMessage,
  currentUserId,
  webRTCManager,
  userProfiles,
  editingMessage,
  onEditMessage,
  onCancelEdit,
  onDeleteMessage
}: ChatTabsProps) => {
  return (
    <Tabs defaultValue="global" className="w-full h-full">
      <div className="border-b border-cybergold-500/30 px-4">
        <TabsList className="bg-transparent border-b-0">
          <TabsTrigger value="global" className="text-cybergold-300 data-[state=active]:text-cybergold-100 data-[state=active]:border-b-2 data-[state=active]:border-cybergold-400 rounded-none">
            Global Chat
          </TabsTrigger>
          {selectedFriend && (
            <TabsTrigger value="direct" className="text-cybergold-300 data-[state=active]:text-cybergold-100 data-[state=active]:border-b-2 data-[state=active]:border-cybergold-400 rounded-none">
              {selectedFriend.profile?.username || 'Direktemelding'}
              <button 
                onClick={onCloseDirectChat}
                className="ml-2 text-xs text-cybergold-400 hover:text-cybergold-300"
              >
                ✕
              </button>
            </TabsTrigger>
          )}
        </TabsList>
      </div>
      
      <TabsContent value="global" className="h-full flex flex-col mt-0 pt-0">
        <ChatGlobal 
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isLoading={isLoading}
          ttl={ttl}
          setTtl={setTtl}
          onMessageExpired={onMessageExpired}
          onSubmit={onSubmit}
          currentUserId={currentUserId}
          editingMessage={editingMessage}
          onEditMessage={onEditMessage}
          onCancelEdit={onCancelEdit}
          onDeleteMessage={onDeleteMessage}
        />
      </TabsContent>
      
      {selectedFriend && (
        <TabsContent value="direct" className="h-full mt-0 pt-0">
          <div className="h-full">
            <DirectMessage 
              friend={selectedFriend}
              currentUserId={currentUserId}
              webRTCManager={webRTCManager}
              onBack={onCloseDirectChat}
              messages={directMessages}
              onNewMessage={onNewMessage}
              userProfiles={userProfiles}
            />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};
