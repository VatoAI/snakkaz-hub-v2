
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center mb-12">
      <div className="relative">
        {/* Logo with glow effect */}
        <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-cyberdark-900 to-cyberdark-950 border-2 border-cybergold-400 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(230,179,0,0.3)] hover:shadow-[0_0_35px_rgba(230,179,0,0.5)] transition-all duration-300">
          <img
            src="/snakkaz-logo.png" 
            alt="SnakkaZ Logo"
            className="rounded-full w-40 h-40 object-cover"
          />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border-2 border-cybergold-400/30 animate-pulse-slow -z-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-cybergold-400/20 -z-10"></div>
      </div>

      {/* Hub title with enhanced animation */}
      <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cybergold-300 via-cybergold-200 to-cybergold-300 bg-clip-text text-transparent animate-gradient mb-4">
        SnakkaZ Hub
      </h1>
      
      {/* Subtitle with button */}
      <div className="flex flex-col items-center">
        <p className="text-xl md:text-2xl text-cybergold-400 mb-4">
          Velg hvilken versjon du vil bruke
        </p>
        
        <button 
          onClick={() => navigate('/chat')}
          className="px-6 py-3 bg-gradient-to-r from-cybergold-500 to-cybergold-600 text-cyberdark-950 rounded-lg font-medium hover:shadow-[0_0_15px_rgba(230,179,0,0.4)] transition-all duration-300"
        >
          Prøv Chat Nå
        </button>
      </div>
    </div>
  );
};
