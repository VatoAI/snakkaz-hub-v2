
import React, { useEffect, useState } from 'react';
import { Button } from "./components/ui/button";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initialization process with better error handling
    try {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Error in initialization:", err);
      setError("Det oppstod en feil under oppstart av applikasjonen.");
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-red-900 text-white p-4 animate-gradient-background">
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold">SnakkaZ Hub</h1>
        <p className="text-lg mt-2">Secure Communication Platform</p>
      </header>
      <main className="container mx-auto mt-8">
        <div className="glass-morphism p-8 rounded-xl">
          <div className="text-center">
            {error ? (
              <>
                <p className="text-red-400 mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="warning"
                >
                  Last på nytt
                </Button>
              </>
            ) : isLoading ? (
              <p className="mb-4">Laster applikasjonen...</p>
            ) : (
              <>
                <p className="mb-4">Velkommen til SnakkaZ Hub!</p>
                <p>Din sikre kommunikasjonsplattform er klar.</p>
                <div className="mt-6">
                  <Button>Kom i gang</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
