
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        toast({
          title: "Not authorized",
          description: "Please sign in to access the chat",
          variant: "destructive",
        });
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
        content,
        created_at,
        sender:profiles!inner(username, full_name)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
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
          // Fetch the complete message with sender information
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              sender:profiles!inner(username, full_name)
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
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
                        {message.sender.full_name || message.sender.username || 'Anonymous'}
                      </p>
                      <p className="text-gray-600">{message.content}</p>
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
              placeholder="Type your message..."
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
