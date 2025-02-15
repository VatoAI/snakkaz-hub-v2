
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Power } from "lucide-react";
import { RegisterFormInputs } from "./RegisterFormInputs";
import { useRegister } from "@/hooks/useRegister";

export const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { handleRegister, isLoading } = useRegister({
    username,
    fullName,
    email,
    password,
    confirmPassword,
  });

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      <RegisterFormInputs
        username={username}
        setUsername={setUsername}
        fullName={fullName}
        setFullName={setFullName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
      />

      <Button
        type="submit"
        className="w-full relative group overflow-hidden bg-gradient-to-r from-cybergold-500 via-cybergold-400 to-cybergold-500 hover:from-cybergold-400 hover:to-cybergold-400 text-cyberdark-950 font-semibold shadow-[0_0_15px_rgba(230,179,0,0.3)] transition-all duration-300 border border-cybergold-300/50 hover:shadow-[0_0_25px_rgba(230,179,0,0.5)]"
        disabled={isLoading}
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
