
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { RegisterHeader } from "@/components/auth/RegisterHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArrowLeft } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-cyberdark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cyberblue-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-red-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
      </div>

      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 text-white hover:text-cyberblue-400 hover:bg-cyberdark-800"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Hjem
      </Button>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <Card className="bg-cyberdark-800/90 backdrop-blur-xl border-2 p-8 rounded-lg shadow-lg"
          style={{ borderImage: "linear-gradient(90deg, #1a9dff, #d62828) 1" }}
        >
          <div className="relative">
            {/* Decorative corner elements */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cyberblue-400"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-cyberblue-400"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-red-500"></div>

            <RegisterHeader />
            <RegisterForm />

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors relative group"
                onClick={() => navigate("/login")}
              >
                Har du allerede en konto? Logg inn
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyberblue-400 to-red-500 group-hover:w-full transition-all duration-300"></span>
              </Button>
            </div>
          </div>
        </Card>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyberblue-400/50 to-transparent"></div>
          <p className="text-center text-sm text-cyberblue-400/50 py-4">
            Beskyttet av industri-ledende sikkerhet
          </p>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
