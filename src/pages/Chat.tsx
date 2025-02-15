
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  encrypted_content: string;
  created_at: string;
  sender: {
    username: string | null;
    full_name: string | null;
  };
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
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

    setMessages(data || []);
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
              created_at,
              sender:profiles(username, full_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const encryptMessage = async (message: string): Promise<{ encryptedContent: string, key: string, iv: string }> => {
    // Generate a random encryption key
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Generate a random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encode the message
    const encodedMessage = new TextEncoder().encode(message);

    // Encrypt the message
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedMessage
    );

    // Convert the encrypted content to base64
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)));
    
    // Export the key and convert to base64
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    
    // Convert IV to base64
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      encryptedContent: encryptedBase64,
      key: keyBase64,
      iv: ivBase64
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
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="bg-white rounded-lg p-4 shadow">
                  <div className="flex items-start gap-x-2">
                    <div className="flex-1">
                      <p className="font-medium text-theme-900">
                        {message.sender.full_name || message.sender.username || 'Anonym'}
                      </p>
                      <p className="text-gray-600">{message.encrypted_content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv din melding..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !newMessage.trim()}
              className="bg-theme-600 hover:bg-theme-700 text-white"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
