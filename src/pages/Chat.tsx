import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { DecryptedMessage, Message } from "@/types/message";
import { encryptMessage, decryptMessage } from "@/utils/encryption";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowMagicLinkForm(true);
      } else {
        setUserId(session.user.id);
        await fetchMessages();
        setupRealtimeSubscription();
      }
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUserId(session?.user.id || null);
        setShowMagicLinkForm(false);
        await fetchMessages();
        setupRealtimeSubscription();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setShowMagicLinkForm(true);
        setMessages([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/chat'
        }
      });

      if (error) {
        toast({
          title: "Påloggingsfeil",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Magisk lenke sendt",
          description: "Sjekk e-posten din for påloggingslenken",
        });
      }
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke sende magisk lenke",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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

  if (showMagicLinkForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-theme-50 via-background to-theme-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-theme-900 mb-6">Logg inn på SnakkaZ Chat</h1>
          <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-post
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-500"
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-theme-600 hover:bg-theme-700 text-white"
            >
              Send magisk lenke
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-50 via-background to-theme-50 flex flex-col">
      <div className="flex-1 container mx-auto max-w-4xl p-4 flex flex-col h-[calc(100vh-2rem)]">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-theme-900">SnakkaZ Chat</h1>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="text-theme-600 hover:text-theme-700"
            >
              Logg ut
            </Button>
          </div>
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
