
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        toast({
          title: "Påloggingsfeil",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke logge inn. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Registreringsfeil",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Registrering vellykket",
          description: "Sjekk e-posten din for bekreftelseslenke.",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke registrere bruker. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyberdark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cybergold-400">CyberChat 2077</h1>
          <p className="mt-2 text-cybergold-300">Logg inn eller registrer deg</p>
        </div>

        <div className="bg-cyberdark-900/80 backdrop-blur-lg rounded-lg border border-cybergold-500/30 shadow-lg p-8">
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
                required
                className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-200 placeholder:text-cyberdark-400"
                placeholder="din@epost.no"
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
                required
                className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-200 placeholder:text-cyberdark-400"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-900"
                disabled={isLoading}
              >
                {isLoading ? 'Logger inn...' : 'Logg inn'}
              </Button>

              <Button
                type="button"
                onClick={handleSignup}
                className="w-full bg-cyberdark-800 border border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700"
                disabled={isLoading}
              >
                Registrer ny bruker
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
