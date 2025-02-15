
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, Power, Lock, Smartphone, Monitor, Video, MessageCircle, Shield, Download, LogIn, UserPlus } from "lucide-react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
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

  const features = [
    { icon: <Lock className="w-6 h-6" />, title: "Ende-til-Ende-Kryptering", description: "100% private meldinger med avansert kryptering" },
    { icon: <Shield className="w-6 h-6" />, title: "Peer-to-Peer", description: "Direkte og sikker kommunikasjon uten mellomservere" },
    { icon: <MessageCircle className="w-6 h-6" />, title: "Instant Messaging", description: "Lynraske meldinger med full kryptering" },
    { icon: <Video className="w-6 h-6" />, title: "Krypterte Samtaler", description: "Sikre tale- og videosamtaler uten avlytting" },
  ];

  const platforms = [
    { icon: <Monitor className="w-6 h-6" />, title: "Desktop App", description: "Windows, Mac og Linux" },
    { icon: <Smartphone className="w-6 h-6" />, title: "Mobil App", description: "iOS og Android" },
  ];

  return (
    <div className="min-h-screen bg-cyberdark-950 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-cyberdark-900 to-cyberdark-950 border-2 border-cybergold-400 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(230,179,0,0.3)]">
              <KeyRound className="w-12 h-12 text-cybergold-300" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cybergold-300 via-cybergold-200 to-cybergold-300 bg-clip-text text-transparent animate-gradient mb-4">
              SnakkaZ
            </h1>
            <p className="text-xl md:text-2xl text-cybergold-400 mb-8">
              Den Sikreste Chatten i Verden
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setShowLoginForm(true)}
                className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950 px-8 py-6 text-lg font-semibold"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Kom i gang
              </Button>
              <Button
                variant="outline"
                className="border-cybergold-400 text-cybergold-400 hover:bg-cybergold-400/10 px-8 py-6 text-lg"
                asChild
              >
                <Link to="/register">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Registrer deg
                </Link>
              </Button>
            </div>
          </div>

          {showLoginForm && (
            <Card className="max-w-md mx-auto bg-cyberdark-800/90 backdrop-blur-xl border-2 border-cybergold-400/50 p-8 rounded-lg shadow-[0_0_25px_rgba(230,179,0,0.15)]">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-cybergold-300">E-post</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-cyberdark-900/90 border-cybergold-400/50 text-cybergold-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-cybergold-300">Passord</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-cyberdark-900/90 border-cybergold-400/50 text-cybergold-200"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950"
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
            </Card>
          )}
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-cyberdark-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-cybergold-300 mb-12">
            Hvorfor Velge SnakkaZ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-cyberdark-800/90 border-cybergold-400/30 p-6 hover:border-cybergold-400/60 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-cybergold-500/10 flex items-center justify-center mb-4 text-cybergold-400">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-cybergold-300 mb-2">{feature.title}</h3>
                  <p className="text-cybergold-400/80">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-cybergold-300 mb-12">
            Tilgjengelig på Alle Plattformer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {platforms.map((platform, index) => (
              <Card key={index} className="bg-cyberdark-800/90 border-cybergold-400/30 p-6 hover:border-cybergold-400/60 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-cybergold-500/10 flex items-center justify-center text-cybergold-400">
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-cybergold-300">{platform.title}</h3>
                    <p className="text-cybergold-400/80">{platform.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950 px-8 py-6 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Last ned SnakkaZ
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-cybergold-400/20">
        <div className="container mx-auto px-4">
          <p className="text-center text-cybergold-400/60">
            © 2024 SnakkaZ. Sikker kommunikasjon for alle.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
