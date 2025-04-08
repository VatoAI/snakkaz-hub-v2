
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

export const AdminAuth = ({ onAuthenticated }: AdminAuthProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated
    const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true";
    if (isAuthenticated) {
      setIsOpen(false);
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleLogin = () => {
    // Simple authentication for demo purposes
    // In a real app, you would use a more secure method
    if (username === "admin" && password === "admin123!") {
      localStorage.setItem("adminAuthenticated", "true");
      setIsOpen(false);
      onAuthenticated();
      toast({
        title: "Innlogget",
        description: "Du er nå logget inn som administrator",
      });
    } else {
      toast({
        title: "Feil",
        description: "Ugyldig brukernavn eller passord",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing the dialog by clicking outside
      if (!open && !localStorage.getItem("adminAuthenticated")) return;
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-md bg-cyberdark-900 border-cyberblue-500/30">
        <DialogHeader>
          <DialogTitle className="text-cyberblue-300">Administrator Innlogging</DialogTitle>
          <DialogDescription className="text-gray-400">
            Skriv inn dine admin-legitimasjoner for å fortsette
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Brukernavn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-cyberdark-950 border-cyberblue-500/30"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Passord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-cyberdark-950 border-cyberblue-500/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            onClick={handleLogin}
            style={{
              background: 'linear-gradient(90deg, #1a9dff, #3b82f6)',
              boxShadow: '0 0 10px rgba(26,157,255,0.4)',
            }}
          >
            Logg Inn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
