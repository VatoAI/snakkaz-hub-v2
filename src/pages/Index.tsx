
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-cyberdark-950 overflow-x-hidden">
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
              SnakkaZ Hub
            </h1>
            <p className="text-xl md:text-2xl text-cybergold-400 mb-8">
              Velg hvilken versjon du vil bruke
            </p>
            
            <div className="flex flex-col md:flex-row justify-center gap-6 max-w-lg mx-auto">
              <a 
                href="https://snakkaz-guardian-chat.lovable.app"
                className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                SnakkaZ Versjon 1
              </a>
              
              <a 
                href="https://chatcipher-assistant.lovable.app"
                className="bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950 px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                SnakkaZ Versjon 2
              </a>
            </div>
            
            <div className="mt-8">
              <Button 
                variant="outline" 
                className="border-cybergold-400/50 text-cybergold-400 hover:bg-cybergold-400/10"
                asChild
              >
                <Link to="/chat">
                  Gå til lokal versjon
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 border-t border-cybergold-400/20">
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
