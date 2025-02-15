
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Power } from "lucide-react";

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Feil",
        description: "Passordene matcher ikke",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: session } = await supabase.auth.getSession();
        
        if (session) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username,
              full_name: fullName,
            });

          if (profileError) throw profileError;

          toast({
            title: "Suksess!",
            description: "Kontoen din er opprettet. Sjekk e-posten din for verifisering.",
          });
          
          navigate("/");
        }
      }
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message || "En feil oppstod under registrering",
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
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cybergold-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyberblue-500/10 rounded-full blur-3xl"></div>
        
        <Card className="bg-cyberdark-900/80 backdrop-blur-lg border-cybergold-500/30 p-8 relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-cyberdark-800 border-2 border-cybergold-500 flex items-center justify-center mb-4 shadow-neon-gold">
              <Shield className="w-8 h-8 text-cybergold-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cybergold-400 to-cybergold-200 bg-clip-text text-transparent">
              Opprett konto
            </h1>
            <p className="text-cyberblue-300 mt-2">Bli med i SnakkaZ i dag</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-cyberblue-300">
                Brukernavn
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
                placeholder="Velg et brukernavn"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-cyberblue-300">
                Fullt navn
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
                placeholder="Ditt fulle navn"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-cyberblue-300">
                E-post
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
                placeholder="din@epost.no"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-cyberblue-300">
                Passord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-cyberblue-300">
                Bekreft passord
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 placeholder:text-cyberdark-600 focus:ring-cyberblue-500 focus:border-cyberblue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900 shadow-neon-gold transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 animate-spin" />
                  Oppretter konto...
                </div>
              ) : (
                "Opprett konto"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-cyberblue-400 hover:text-cyberblue-300"
              asChild
            >
              <Link to="/">Har du allerede en konto? Logg inn</Link>
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-cyberdark-500">
          Beskyttet av industri-ledende sikkerhet
        </p>
      </div>
    </div>
  );
};

export default Register;
