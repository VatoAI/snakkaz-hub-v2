
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Power } from "lucide-react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Suksess",
          description: "Du er nå logget inn",
        });
        navigate("/chat");
      }
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message || "En feil oppstod under innlogging",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyberdark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cybergold-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cybergold-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        
        <Card className="bg-cyberdark-900/80 backdrop-blur-lg border-2 border-cybergold-400 p-8 relative z-10 shadow-[0_0_15px_rgba(230,179,0,0.3)]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-cyberdark-800 border-2 border-cybergold-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(230,179,0,0.5)]">
              <KeyRound className="w-8 h-8 text-cybergold-300" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cybergold-300 via-cybergold-200 to-cybergold-300 bg-clip-text text-transparent">
              SnakkaZ
            </h1>
            <p className="text-cybergold-400 mt-2">Sikker meldingsutveksling</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-cybergold-300">
                E-post
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400 focus:border-cybergold-400"
                placeholder="din@epost.no"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-cybergold-300">
                Passord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400 focus:border-cybergold-400"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cybergold-500 via-cybergold-400 to-cybergold-500 hover:from-cybergold-400 hover:to-cybergold-400 text-cyberdark-900 shadow-[0_0_15px_rgba(230,179,0,0.5)] transition-all duration-300 border border-cybergold-300/50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 animate-spin" />
                  Logger inn...
                </div>
              ) : (
                "Logg inn"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-cybergold-400 hover:text-cybergold-300 transition-colors"
              asChild
            >
              <Link to="/register">Opprett en konto</Link>
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-cybergold-400/50">
          Beskyttet av industri-ledende sikkerhet
        </p>
      </div>
    </div>
  );
};

export default Index;
