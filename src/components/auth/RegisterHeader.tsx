
import { CardDescription, CardTitle } from "@/components/ui/card";

export const RegisterHeader = () => {
  return (
    <div className="text-center mb-6">
      <div className="flex justify-center mb-4">
        <img src="/snakkaz-logo.png" alt="SnakkaZ Logo" className="h-16 w-16 rounded-full" />
      </div>
      <CardTitle className="text-2xl mb-2"
        style={{
          background: 'linear-gradient(90deg, #1a9dff, #ffffff, #d62828)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Registrer deg på SnakkaZ
      </CardTitle>
      <CardDescription className="text-gray-400">
        Opprett din sikre SnakkaZ-konto for å starte samtaler
      </CardDescription>
      
      <div className="mt-4 h-px w-full bg-gradient-to-r from-cyberblue-500/20 via-white/30 to-red-500/20"></div>
    </div>
  );
};
