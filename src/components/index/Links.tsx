
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Links = () => {
  return (
    <>
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
    </>
  );
};
