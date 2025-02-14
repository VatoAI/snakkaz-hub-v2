
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    console.log("Login attempted with:", { email, password });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-theme-50 via-background to-theme-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fadeIn">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-theme-900">
            SnakkaZ
          </h1>
          <p className="text-muted-foreground">
            Secure messaging for everyone
          </p>
        </div>

        <Card className="p-6 backdrop-blur-sm bg-white/80 border border-theme-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-theme-600 hover:bg-theme-700 text-white transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-theme-600 hover:text-theme-700"
            >
              Create an account
            </Button>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Protected by industry-leading security
        </p>
      </div>
    </div>
  );
};

export default Index;
