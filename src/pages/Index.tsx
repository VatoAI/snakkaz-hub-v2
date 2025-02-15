
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
    <div className="min-h-screen bg-cyberdark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <Card className="bg-cyberdark-900/90 backdrop-blur-xl border-2 border-cybergold-400/50 p-8 rounded-lg shadow-[0_0_25px_rgba(230,179,0,0.15)]">
          <div className="relative">
            {/* Decorative corner elements */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cybergold-400"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-cybergold-400"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-cybergold-400"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cybergold-400"></div>

            <div className="flex flex-col items-center mb-8 relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyberdark-800 to-cyberdark-900 border-2 border-cybergold-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(230,179,0,0.3)] relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cybergold-400/20 to-transparent animate-spin-slow"></div>
                <KeyRound className="w-10 h-10 text-cybergold-300 relative z-10" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cybergold-300 via-cybergold-200 to-cybergold-300 bg-clip-text text-transparent animate-gradient">
                SnakkaZ
              </h1>
              <p className="text-cybergold-400 mt-2 text-lg">Sikker meldingsutveksling</p>
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-cybergold-400/30"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-cybergold-400/30"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-cybergold-300">
                  E-post
                </label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-cyberdark-800/90 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400/50 focus:border-cybergold-400 transition-all duration-300 group-hover:border-cybergold-400/70"
                    placeholder="din@epost.no"
                    required
                  />
                  <div className="absolute inset-0 border border-cybergold-400/20 rounded-md filter blur-sm transition-opacity opacity-0 group-hover:opacity-100"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-cybergold-300">
                  Passord
                </label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-cyberdark-800/90 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400/50 focus:border-cybergold-400 transition-all duration-300 group-hover:border-cybergold-400/70"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute inset-0 border border-cybergold-400/20 rounded-md filter blur-sm transition-opacity opacity-0 group-hover:opacity-100"></div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full relative group overflow-hidden bg-gradient-to-r from-cybergold-500 via-cybergold-400 to-cybergold-500 hover:from-cybergold-400 hover:to-cybergold-400 text-cyberdark-900 shadow-[0_0_15px_rgba(230,179,0,0.3)] transition-all duration-300 border border-cybergold-300/50 hover:shadow-[0_0_25px_rgba(230,179,0,0.5)]"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative">
                  {isLoading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <Power className="w-4 h-4 animate-spin" />
                      Logger inn...
                    </div>
                  ) : (
                    "Logg inn"
                  )}
                </span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-cybergold-400 hover:text-cybergold-300 transition-colors relative group"
                asChild
              >
                <Link to="/register">
                  Opprett en konto
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cybergold-400 to-cybergold-300 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cybergold-400/50 to-transparent"></div>
          <p className="text-center text-sm text-cybergold-400/50 py-4">
            Beskyttet av industri-ledende sikkerhet
          </p>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cybergold-400/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
