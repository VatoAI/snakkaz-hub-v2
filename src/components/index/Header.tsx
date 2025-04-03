
export const Header = () => {
  return (
    <div className="text-center mb-12">
      {/* Større logo */}
      <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-cyberdark-900 to-cyberdark-950 border-2 border-cybergold-400 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(230,179,0,0.3)]">
        <img
          src="/snakkaz-logo.png" 
          alt="SnakkaZ Logo"
          className="rounded-full w-40 h-40 object-cover"
        />
      </div>

      {/* Tekst */}
      <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cybergold-300 via-cybergold-200 to-cybergold-300 bg-clip-text text-transparent animate-gradient mb-4">
        SnakkaZ Hub
      </h1>
      <p className="text-xl md:text-2xl text-cybergold-400 mb-8">
        Velg hvilken versjon du vil bruke
      </p>
    </div>
  );
};
