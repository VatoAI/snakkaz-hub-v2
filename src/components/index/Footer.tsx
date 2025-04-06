
import { useNavigate } from 'react-router-dom';

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 border-t border-cyberblue-400/20 bg-cyberdark-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-center md:text-left text-cyberblue-400/70">
              © {currentYear} SnakkaZ. Sikker kommunikasjon for alle.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <button 
              onClick={() => navigate('/chat')}
              className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors relative group"
            >
              Chat
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-cyberblue-500 group-hover:w-full transition-all duration-300"></span>
            </button>
            <button
              onClick={() => navigate('/register')} 
              className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors relative group"
            >
              Register
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-cyberblue-500 group-hover:w-full transition-all duration-300"></span>
            </button>
            <button 
              onClick={() => navigate('/profil')}
              className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors relative group"
            >
              Profil
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-cyberblue-500 group-hover:w-full transition-all duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
