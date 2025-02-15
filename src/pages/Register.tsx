
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RegisterHeader } from "@/components/auth/RegisterHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen bg-cyberdark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <Card className="bg-cyberdark-800/90 backdrop-blur-xl border-2 border-cybergold-400/50 p-8 rounded-lg shadow-[0_0_25px_rgba(230,179,0,0.15)]">
          <div className="relative">
            {/* Decorative corner elements */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cybergold-400"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-cybergold-400"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-cybergold-400"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cybergold-400"></div>

            <RegisterHeader />
            <RegisterForm />

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-cybergold-400 hover:text-cybergold-300 transition-colors relative group"
                asChild
              >
                <Link to="/">
                  Har du allerede en konto? Logg inn
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cybergold-400 to-cybergold-300 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cybergold-400/50 to-transparent"></div>
          <p className="text-center text-sm text-cybergold-400/50 py-4">
            Beskyttet av industri-ledende sikkerhet
          </p>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cybergold-400/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
