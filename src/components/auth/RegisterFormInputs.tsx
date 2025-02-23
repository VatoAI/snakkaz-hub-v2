
import { Input } from "@/components/ui/input";

interface RegisterFormInputsProps {
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
}

export const RegisterFormInputs = ({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
}: RegisterFormInputsProps) => {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-cybergold-300">
          Brukernavn
        </label>
        <div className="relative group">
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-cyberdark-900/90 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400/50 focus:border-cybergold-400 transition-all duration-300 group-hover:border-cybergold-400/70"
            placeholder="Velg et brukernavn"
            required
          />
          <div className="absolute inset-0 border border-cybergold-400/20 rounded-md filter blur-sm transition-opacity opacity-0 group-hover:opacity-100"></div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-cybergold-300">
          E-post
        </label>
        <div className="relative group">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-cyberdark-900/90 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400/50 focus:border-cybergold-400 transition-all duration-300 group-hover:border-cybergold-400/70"
            placeholder="din@epost.no"
            required
          />
          <div className="absolute inset-0 border border-cybergold-400/20 rounded-md filter blur-sm transition-opacity opacity-0 group-hover:opacity-100"></div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-cybergold-300">
          Passord
        </label>
        <div className="relative group">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-cyberdark-900/90 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400/50 focus:border-cybergold-400 transition-all duration-300 group-hover:border-cybergold-400/70"
            placeholder="••••••••"
            required
          />
          <div className="absolute inset-0 border border-cybergold-400/20 rounded-md filter blur-sm transition-opacity opacity-0 group-hover:opacity-100"></div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-cybergold-300">
          Bekreft passord
        </label>
        <div className="relative group">
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-cyberdark-900/90 border-cybergold-400/50 text-cybergold-200 placeholder:text-cybergold-400/30 focus:ring-cybergold-400/50 focus:border-cybergold-400 transition-all duration-300 group-hover:border-cybergold-400/70"
            placeholder="••••••••"
            required
          />
          <div className="absolute inset-0 border border-cybergold-400/20 rounded-md filter blur-sm transition-opacity opacity-0 group-hover:opacity-100"></div>
        </div>
      </div>
    </>
  );
};
