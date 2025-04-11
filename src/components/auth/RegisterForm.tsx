
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Power } from "lucide-react";
import { RegisterFormInputs } from "./RegisterFormInputs";
import { useRegister } from "@/hooks/useRegister";
import { useNavigate } from "react-router-dom";

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { handleRegister, isLoading } = useRegister({
    username,
    fullName: "", // Vi sender en tom string siden vi har fjernet dette feltet
    email,
    password,
    confirmPassword,
  });

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <RegisterFormInputs
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
      />

      <Button
        type="submit"
        className="w-full relative group overflow-hidden text-white font-semibold text-lg transition-all duration-300 border border-transparent"
        disabled={isLoading}
        style={{
          background: 'linear-gradient(90deg, #1a9dff 0%, #3b82f6 50%, #d62828 100%)',
          boxShadow: '0 0 15px rgba(26,157,255,0.4), 0 0 15px rgba(214,40,40,0.4)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        <span className="relative text-lg">
          {isLoading ? (
            <div className="flex items-center gap-2 justify-center">
              <Power className="w-4 h-4 animate-spin" />
              Oppretter konto...
            </div>
          ) : (
            "Opprett konto"
          )}
        </span>
      </Button>
    </form>
  );
};
