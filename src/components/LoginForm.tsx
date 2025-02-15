
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginForm = ({ email, setEmail, onSubmit }: LoginFormProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-50 via-background to-theme-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-theme-900 mb-6">Logg inn på SnakkaZ Chat</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-post
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-500"
              required
            />
          </div>
          <Button 
            type="submit"
            className="w-full bg-theme-600 hover:bg-theme-700 text-white"
          >
            Send magisk lenke
          </Button>
        </form>
      </div>
    </div>
  );
};
