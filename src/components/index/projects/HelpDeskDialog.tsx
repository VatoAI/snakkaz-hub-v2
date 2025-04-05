
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface HelpDeskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDeskDialog = ({ open, onOpenChange }: HelpDeskDialogProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    
    // Simulate sending a message
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Message sent",
      description: "Thank you for your message. We'll get back to you shortly.",
      duration: 5000,
    });
    
    setMessage("");
    setIsSending(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-cyberdark-900 border-cyberblue-500 text-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center text-cyberblue-400">
            <HelpCircle className="mr-2" size={20} />
            AI Help Desk
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Ask a question or request assistance with any SnakkaZ product.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-cyberdark-950 p-4 rounded-md border border-cyberdark-700 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-cyberblue-900 p-1 rounded-full">
              <MessageSquare size={18} className="text-cyberblue-300" />
            </div>
            <div>
              <p className="text-xs text-cyberblue-400 mb-1">AI Assistant</p>
              <p className="text-sm text-gray-300">
                Hello! How can I assist you with SnakkaZ products today?
              </p>
            </div>
          </div>
        </div>
        
        <Textarea 
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px] bg-cyberdark-800 border-cyberdark-700 text-gray-300 focus:border-cyberblue-500 focus:ring-cyberblue-500"
        />
        
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-cyberblue-500 hover:bg-cyberblue-600 text-white"
          >
            {isSending ? "Sending..." : (
              <>
                <Send size={16} className="mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
