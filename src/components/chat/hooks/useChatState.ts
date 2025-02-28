
import { useState } from 'react';
import { UserPresence, UserStatus } from '@/types/presence';
import { DecryptedMessage } from '@/types/message';
import { Friend } from '@/components/chat/friends/types';
import { useToast } from "@/components/ui/use-toast";

export const useChatState = () => {
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('online');
  const [directMessages, setDirectMessages] = useState<DecryptedMessage[]>([]);
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, {username: string | null, avatar_url: string | null}>>({});
  const [activeTab, setActiveTab] = useState<string>("global");

  return {
    authLoading,
    setAuthLoading,
    userId,
    setUserId,
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
    toast
  };
};
