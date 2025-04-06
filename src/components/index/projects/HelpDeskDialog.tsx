
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, MessageSquare, Send, UserCircle, Bot } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface HelpDeskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDeskDialog = ({ open, onOpenChange }: HelpDeskDialogProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    
    // Simulate sending a message
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Melding sendt",
      description: "Takk for din henvendelse. Vi vil svare så snart som mulig.",
      duration: 5000,
    });
    
    setSentMessage(true);
    setIsSending(false);
  };

  const handleClose = () => {
    setMessage("");
    setSentMessage(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-cyberdark-900 border-cyberblue-500/80 text-gray-200 shadow-[0_0_30px_rgba(26,157,255,0.2)]">
        <DialogHeader className="border-b border-cyberblue-500/30 pb-4">
          <DialogTitle className="flex items-center text-cyberblue-300">
            <div className="bg-cyberblue-500/20 p-1 rounded-md mr-2">
              <Bot className="text-cyberblue-400" size={18} />
            </div>
            SnakkaZ AI Hjelp
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Spør om hjelp med SnakkaZ produkter eller tjenester
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-cyberdark-950/70 p-4 rounded-md border border-cyberdark-700 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-cyberblue-900/80 p-1.5 rounded-full">
              <Bot size={18} className="text-cyberblue-300" />
            </div>
            <div>
              <p className="text-xs text-cyberblue-400 mb-1">SnakkaZ Assistant</p>
              <p className="text-sm text-gray-300">
                {sentMessage 
                  ? "Takk for din henvendelse! Jeg vil sørge for at teamet vårt svarer deg så snart som mulig."
                  : "Hei! Hvordan kan jeg hjelpe deg med SnakkaZ-produkter i dag?"}
              </p>
            </div>
          </div>
          
          {sentMessage && (
            <div className="flex items-start gap-3 mt-4 ml-6">
              <div className="bg-cyberblue-900/40 p-1.5 rounded-full">
                <UserCircle size={18} className="text-cyberblue-200" />
              </div>
              <div>
                <p className="text-xs text-cyberblue-400/70 mb-1">Du</p>
                <p className="text-sm text-gray-300/90">{message}</p>
              </div>
            </div>
          )}
        </div>
        
        {!sentMessage && (
          <Textarea 
            placeholder="Skriv din melding her..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] bg-cyberdark-800 border-cyberdark-700 text-gray-300 focus:border-cyberblue-500 focus:ring-cyberblue-500"
          />
        )}
        
        <DialogFooter>
          {sentMessage ? (
            <Button 
              type="button" 
              onClick={handleClose}
              className="bg-cyberblue-500 hover:bg-cyberblue-600 text-white"
            >
              Lukk
            </Button>
          ) : (
            <Button 
              type="submit" 
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="bg-cyberblue-500 hover:bg-cyberblue-600 text-white"
            >
              {isSending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-t-transparent border-r-white border-b-white border-l-white rounded-full animate-spin mr-2"></div>
                  Sender...
                </div>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send melding
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
