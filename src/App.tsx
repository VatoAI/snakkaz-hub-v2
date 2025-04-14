
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-red-900 text-white p-4 animate-gradient-background">
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold">SnakkaZ Hub</h1>
        <p className="text-lg mt-2">Secure Communication Platform</p>
      </header>
      <main className="container mx-auto mt-8">
        <div className="bg-black/40 backdrop-blur-md p-8 rounded-xl border border-white/10">
          <div className="text-center">
            <p className="mb-4">Velkommen til SnakkaZ Hub!</p>
            <p>Din sikre kommunikasjonsplattform laster...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
