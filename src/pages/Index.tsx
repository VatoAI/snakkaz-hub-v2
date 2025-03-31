
import { Header } from "@/components/index/Header";
import { Links } from "@/components/index/Links";
import { Footer } from "@/components/index/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-cyberdark-950 overflow-x-hidden">
      <div className="relative min-h-screen flex flex-col p-4">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-l from-cybergold-500/20 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 flex-grow">
          <Header />
          <Links />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
