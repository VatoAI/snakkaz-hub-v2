
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SnakkazButton } from '@/components/ui/snakkaz-button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { securityEventLoggerInstance } from '@/utils/security';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Log login attempt (without sensitive data)
      securityEventLoggerInstance.logEvent('login_attempt', { 
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        
        // Log login failure (without sensitive data)
        securityEventLoggerInstance.logEvent('login_failed', { 
          reason: error.message
        });
        
        toast({
          title: "Pålogging mislyktes",
          description: "Kontroller brukernavn og passord",
          variant: "destructive",
        });
      } else {
        // Log successful login
        securityEventLoggerInstance.logEvent('login_success', { 
          user_id: data.user?.id
        });
        
        toast({
          title: "Pålogging vellykket",
          description: "Velkommen tilbake til SnakkaZ",
        });
        
        navigate('/chat');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('En uventet feil oppstod. Vennligst prøv igjen senere.');
      
      securityEventLoggerInstance.logEvent('login_error', { 
        error: 'Unexpected error during login'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 flex items-start">
          <AlertCircle className="text-red-500 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-cyberblue-300">E-post</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyberblue-400">
              <Mail size={18} />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-cyberdark-800/80 border-cyberblue-500/30 focus:border-cyberblue-400"
              placeholder="din.epost@eksempel.no"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-cyberblue-300">Passord</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyberblue-400">
              <Lock size={18} />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-cyberdark-800/80 border-cyberblue-500/30 focus:border-cyberblue-400"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyberblue-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="pt-2">
        <SnakkazButton
          type="submit"
          className="w-full py-5"
          disabled={isLoading}
        >
          {isLoading ? 'Logger inn...' : 'Logg inn'}
        </SnakkazButton>
      </div>
      
      <div className="text-center">
        <a
          href="#"
          className="text-sm text-cyberblue-400 hover:text-cyberblue-300 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // Handle password reset
          }}
        >
          Glemt passordet?
        </a>
      </div>
    </form>
  );
};
