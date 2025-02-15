
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useAuthState = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/chat'
        }
      });

      if (error) {
        toast({
          title: "Påloggingsfeil",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Magisk lenke sendt",
          description: "Sjekk e-posten din for påloggingslenken",
        });
      }
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke sende magisk lenke",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowMagicLinkForm(true);
      return null;
    }
    setUserId(session.user.id);
    return session.user.id;
  };

  return {
    userId,
    email,
    setEmail,
    showMagicLinkForm,
    handleMagicLinkLogin,
    handleSignOut,
    checkAuth
  };
};
