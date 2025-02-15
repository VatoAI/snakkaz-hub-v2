
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { DecryptedMessage, Message } from "@/types/message";
import { encryptMessage, decryptMessage } from "@/utils/encryption";

const Chat = () => {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        toast({
          title: "Ikke autorisert",
          description: "Vennligst logg inn for å få tilgang til chatten",
          variant: "destructive",
        });
      } else {
        setUserId(session.user.id);
      }
    };
    
    checkAuth();
    fetchMessages();
    setupRealtimeSubscription();
  }, []);

  const fetchMessages = async () => {
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
      toast({
        title: "Feil",
        description: "Kunne ikke laste meldinger",
        variant: "destructive",
      });
      return;
    }

    const decryptedMessages = await Promise.all(
      (data || []).map(async (message) => ({
        ...message,
        content: await decryptMessage(message)
      }))
    );

    setMessages(decryptedMessages);
  };

  const setupRealtimeSubscription = () => {
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

          if (!error && data) {
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setIsLoading(true);
    try {
      const { encryptedContent, key, iv } = await encryptMessage(newMessage.trim());
      
      const { error } = await supabase
        .from('messages')
        .insert({
          encrypted_content: encryptedContent,
          encryption_key: key,
          iv: iv,
          sender_id: userId
        });

      if (error) {
        toast({
          title: "Feil",
          description: "Kunne ikke sende melding",
          variant: "destructive",
        });
      } else {
        setNewMessage("");
      }
    } catch (error) {
      toast({
        title: "Krypteringsfeil",
        description: "Kunne ikke kryptere meldingen",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-50 via-background to-theme-50 flex flex-col">
      <div className="flex-1 container mx-auto max-w-4xl p-4 flex flex-col h-[calc(100vh-2rem)]">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-theme-900 mb-4">SnakkaZ Chat</h1>
          <MessageList messages={messages} />
          <MessageInput 
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
