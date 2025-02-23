
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('E-post er påkrevd');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Vennligst skriv inn en gyldig e-postadresse');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Passord er påkrevd');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Passordet må være minst 6 tegn');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error details:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Påloggingsfeil",
            description: "Feil e-post eller passord. Hvis du nettopp registrerte deg, sjekk at du har bekreftet e-posten din.",
            variant: "destructive",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "E-post ikke bekreftet",
            description: "Vennligst bekreft e-posten din før du logger inn. Sjekk innboksen din for en bekreftelseslenke.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Påloggingsfeil",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Suksess!",
          description: "Du er nå logget inn.",
        });
        window.location.href = 'https://www.SnakkaZ.com/chat';
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast({
        title: "Uventet feil",
        description: "Kunne ikke logge inn. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (password.length < 6) {
        toast({
          title: "Ugyldig passord",
          description: "Passordet må være minst 6 tegn langt.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://www.SnakkaZ.com/chat'
        }
      });

      if (error) {
        console.error('Signup error details:', error);
        
        if (error.message.includes('User already registered')) {
          toast({
            title: "Registreringsfeil",
            description: "En bruker med denne e-postadressen eksisterer allerede. Prøv å logge inn i stedet.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registreringsfeil",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Registrering vellykket",
          description: "Vi har sendt deg en e-post med en bekreftelseslenke. Vennligst bekreft e-posten din før du logger inn.",
        });
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      toast({
        title: "Uventet feil",
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
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-cybergold-400">
            SnakkaZ
          </h1>
          <p className="text-lg text-cybergold-300">
            Logg inn eller registrer deg
          </p>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-200 placeholder:text-cyberdark-400 focus:border-cybergold-400 focus:ring-2 focus:ring-cybergold-400/50"
                placeholder="din@epost.no"
                autoComplete="email"
              />
              {emailError && (
                <p className="text-sm text-red-400">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-cybergold-300">
                Passord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-200 placeholder:text-cyberdark-400 focus:border-cybergold-400 focus:ring-2 focus:ring-cybergold-400/50"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
              <p className="text-sm text-cybergold-300/70">
                Minimum 6 tegn
              </p>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950 font-medium text-lg h-11 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logger inn...
                  </div>
                ) : (
                  'Logg inn'
                )}
              </Button>

              <Button
                type="button"
                onClick={handleSignup}
                className="w-full bg-cyberdark-800 border border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700 font-medium text-lg h-11 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Registrerer...
                  </div>
                ) : (
                  'Registrer ny bruker'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
