
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FriendSearch } from "./FriendSearch";
import { FriendRequests } from "./FriendRequests";
import { FriendsList } from "./FriendsList";
import { Friend, UserProfile } from "./types";
import { WebRTCManager } from "@/utils/webrtc";
import { DecryptedMessage } from "@/types/message";

interface FriendsContainerProps {
  currentUserId: string;
  webRTCManager: WebRTCManager | null;
  directMessages: DecryptedMessage[];
  onNewMessage: (message: DecryptedMessage) => void;
}

export const FriendsContainer = ({ 
  currentUserId,
  webRTCManager,
  directMessages,
  onNewMessage
}: FriendsContainerProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
      const cleanup = setupFriendsSubscription();
      return () => {
        cleanup();
      };
    }
  }, [currentUserId]);

  const fetchFriends = async () => {
    try {
      console.log('Fetching friends for user:', currentUserId);
      
      // Først henter vi vennskap hvor brukeren er enten user_id eller friend_id
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          friend_id,
          user_id
        `)
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (friendshipsError) {
        console.error('Error fetching friendships:', friendshipsError);
        throw friendshipsError;
      }

      if (!friendships?.length) {
        console.log('No friendships found');
        setFriends([]);
        setFriendRequests([]);
        return;
      }

      console.log('Found friendships:', friendships);

      // Henter profiler for alle involverte brukere
      const friendIds = friendships.map(f => 
        f.user_id === currentUserId ? f.friend_id : f.user_id
      );

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Found profiles:', profiles);

      // Kombinerer vennskap og profiler
      const processedFriends = friendships.map(friendship => {
        const friendId = friendship.user_id === currentUserId 
          ? friendship.friend_id 
          : friendship.user_id;
        
        const profile = profiles?.find(p => p.id === friendId);
        
        return {
          ...friendship,
          profile: profile || null
        };
      });

      console.log('Processed friends:', processedFriends);

      setFriends(processedFriends.filter(f => f.status === 'accepted'));
      setFriendRequests(processedFriends.filter(f => 
        f.status === 'pending' && f.friend_id === currentUserId
      ));

    } catch (error) {
      console.error('Error in fetchFriends:', error);
      toast({
        title: "Feil ved henting av venner",
        description: "Kunne ikke hente vennelisten din",
        variant: "destructive",
      });
    }
  };

  const setupFriendsSubscription = () => {
    const friendsSubscription = supabase
      .channel('friendships-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `user_id=eq.${currentUserId}` 
        }, 
        () => {
          fetchFriends();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `friend_id=eq.${currentUserId}` 
        }, 
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendsSubscription);
    };
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .ilike('username', `%${searchUsername}%`)
        .limit(5);

      if (error) {
        throw error;
      }

      const filteredResults = data?.filter(profile => profile.id !== currentUserId) || [];
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Søkefeil",
        description: "Kunne ikke søke etter brukere",