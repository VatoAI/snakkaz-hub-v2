
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UseRegisterProps {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const useRegister = ({
  username,
  fullName,
  email,
  password,
  confirmPassword,
}: UseRegisterProps) => {
  const [isLoading, setIsLoading] = useState(false);
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

      if (authError) {
        if (authError.message.includes("User already registered")) {
          toast({
            title: "Registrering feilet",
            description: "En bruker med denne e-postadressen finnes allerede. Prøv å logge inn i stedet.",
            variant: "destructive",
          });
          navigate("/login"); // Redirect to login page
          return;
        }
        throw authError;
      }

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
            description: "Kontoen din er opprettet. Du blir nå omdirigert til Chat.",
          });
          
          // Redirect to Chat after successful registration
          navigate("/chat");
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

  return { handleRegister, isLoading };
};
