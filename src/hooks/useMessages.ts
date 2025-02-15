
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DecryptedMessage } from "@/types/message";
import { encryptMessage, decryptMessage } from "@/utils/encryption";

export const useMessages = (userId: string | null) => {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttl, setTtl] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchMessages = async () => {
    console.log("Henter meldinger...");
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        encrypted_content,
        encryption_key,
        iv,
        created_at,
        sender:profiles(username, full_name)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Feil ved henting av meldinger:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste meldinger: " + error.message,
        variant: "destructive",
      });
      return;
    }

    console.log("Mottatte meldinger:", data);
    const decryptedMessages = await Promise.all(
      (data || []).map(async (message) => ({
        ...message,
        content: await decryptMessage(message)
      }))
    );
    console.log("Dekrypterte meldinger:", decryptedMessages);
    setMessages(decryptedMessages);
  };

  const setupRealtimeSubscription = () => {
    console.log("Setter opp sanntidsabonnement...");
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log("Ny melding mottatt:", payload);
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              encrypted_content,
              encryption_key,
              iv,
              created_at,
              sender:profiles(username, full_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error("Feil ved henting av ny melding:", error);
            return;
          }

          if (data) {
            console.log("Dekrypterer ny melding:", data);
            const decryptedMessage = {
              ...data,
              content: await decryptMessage(data)
            };
            setMessages(prev => [...prev, decryptedMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addP2PMessage = (message: string, peerId: string) => {
    const p2pMessage: DecryptedMessage = {
      id: `p2p-${Date.now()}`,
      content: message,
      created_at: new Date().toISOString(),
      encryption_key: '',
      iv: '',
      sender: {
        username: peerId,
        full_name: null
      }
    };
    setMessages(prev => [...prev, p2pMessage]);
  };

  const handleSendMessage = async (webRTCManager: any, onlineUsers: Set<string>) => {
    if (!newMessage.trim() || !userId) {
      console.log("Ingen melding å sende eller bruker ikke pålogget");
      return;
    }

    setIsLoading(true);
    try {
      if (webRTCManager) {
        onlineUsers.forEach(peerId => {
          if (peerId !== userId) {
            webRTCManager.sendMessage(peerId, newMessage.trim());
          }
        });
      }

      console.log("Krypterer melding...");
      const { encryptedContent, key, iv } = await encryptMessage(newMessage.trim());
      
      console.log("Sender melding til Supabase...");
      const { error } = await supabase
        .from('messages')
        .insert({
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          sender_id: userId,
          ephemeral_ttl: ttl
        });

      if (error) {
        console.error('Send message error:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke sende melding: " + error.message,
          variant: "destructive",
        });
      } else {
        console.log("Melding sendt vellykket");
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke sende melding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    ttl,
    setTtl,
    fetchMessages,
    setupRealtimeSubscription,
    addP2PMessage,
    handleSendMessage
  };
};
