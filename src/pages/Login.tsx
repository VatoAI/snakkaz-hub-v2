
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      
      if (error) {
        throw error;
      }
      
      if (data && data.user) {
        toast({
          title: "Logg inn vellykket",
          description: "Du blir nå omdirigert til SnakkaZ Chat",
        });
        
        // Redirect to chat
        navigate("/chat");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Feil ved innlogging",
        description: error.message || "Kontroller brukernavn og passord og prøv igjen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyberdark-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        {/* Background effects similar to Index page */}
        <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-r from-cyberblue-500/30 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-l from-red-500/30 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
      </div>
      
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 text-white hover:text-cyberblue-400 hover:bg-cyberdark-800"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Hjem
      </Button>
      
      <div className="w-full max-w-md z-10">
        <Card className="bg-cyberdark-900 border-2 shadow-xl"
          style={{ borderImage: "linear-gradient(90deg, #1a9dff, #d62828) 1" }}
        >
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/snakkaz-logo.png" alt="SnakkaZ Logo" className="h-16 w-16 rounded-full" />
            </div>
            <CardTitle className="text-2xl text-center font-bold"
              style={{
                background: 'linear-gradient(90deg, #1a9dff, #ffffff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Logg inn på SnakkaZ
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sikker pålogging med ende-til-ende-kryptering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    placeholder="E-post"
                    type="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-cyberdark-800 border-gray-700"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    placeholder="Passord"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-cyberdark-800 border-gray-700"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(90deg, #1a9dff 0%, #3b82f6 50%, #d62828 100%)',
                  boxShadow: '0 0 15px rgba(26,157,255,0.4), 0 0 15px rgba(214,40,40,0.4)'
                }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                ) : null}
                Logg inn
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-400">
              <span>Har du ikke en konto? </span>
              <Button 
                variant="link" 
                onClick={() => navigate("/register")}
                className="text-cyberblue-400 hover:text-cyberblue-300 p-0"
              >
                Registrer deg
              </Button>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">
              SnakkaZ bruker sikker ende-til-ende-kryptering for all kommunikasjon
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
