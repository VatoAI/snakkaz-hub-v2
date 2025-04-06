
import { useNavigate } from 'react-router-dom';

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 border-t border-cybergold-400/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-center md:text-left text-cybergold-400/60">
              © {currentYear} SnakkaZ. Sikker kommunikasjon for alle.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <button 
              onClick={() => navigate('/chat')}
              className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors"
            >
              Chat
            </button>
            <button
              onClick={() => navigate('/register')} 
              className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors"
            >
              Register
            </button>
            <button 
              onClick={() => navigate('/profil')}
              className="text-cyberblue-400 hover:text-cyberblue-300 transition-colors"
            >
              Profil
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
