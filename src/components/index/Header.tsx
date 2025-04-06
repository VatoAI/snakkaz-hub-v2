
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  return (
    <div className="text-center mb-8 md:mb-12">
      <div className="relative">
        {/* Logo with enhanced glow effect */}
        <div className={`${isMobile ? 'w-32 h-32' : 'w-48 h-48'} mx-auto rounded-full bg-gradient-to-r from-cyberdark-900 to-cyberdark-950 border-2 border-cyberblue-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(26,157,255,0.4)] hover:shadow-[0_0_40px_rgba(26,157,255,0.6)] transition-all duration-300`}>
          <img
            src="/snakkaz-logo.png" 
            alt="SnakkaZ Logo"
            className={`rounded-full ${isMobile ? 'w-24 h-24' : 'w-40 h-40'} object-cover`}
            onError={(e) => {
              console.log("Logo failed to load, using fallback");
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
        
        {/* Decorative elements with blue glow instead of gold */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border-2 border-cyberblue-400/40 animate-pulse-slow -z-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-cyberblue-400/30 -z-10"></div>
      </div>

      {/* Hub title with enhanced visibility */}
      <div className="relative mb-4">
        <h1
          className={`${isMobile ? 'text-4xl' : 'text-5xl md:text-6xl'} font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyberblue-300 via-white to-cyberblue-300`}
          style={{
            textShadow: '0 0 8px #00bfff, 0 0 15px #00bfff, 0 0 20px #00bfff',
            WebkitBackgroundClip: 'text',
            filter: 'drop-shadow(0 0 5px rgba(26,157,255,0.6))'
          }}
        >
          SnakkaZ Hub
        </h1>
        
        {/* Add backlight effect to improve text visibility */}
        <div className="absolute inset-0 bg-cyberblue-500/10 filter blur-xl rounded-full -z-10"></div>
      </div>
      
      {/* Subtitle with button */}
      <div className="flex flex-col items-center">
        <p className="text-lg md:text-2xl text-cyberblue-400 mb-6 font-medium">
          Velg hvilken versjon du vil bruke
        </p>
        
        <button 
          onClick={() => navigate('/chat')}
          className="px-8 py-4 bg-gradient-to-r from-cyberblue-500 to-cyberblue-600 text-white rounded-lg font-medium text-lg hover:shadow-[0_0_15px_rgba(26,157,255,0.6)] transition-all duration-300 transform hover:scale-105"
        >
          Prøv Chat Nå
        </button>
      </div>
    </div>
  );
};
