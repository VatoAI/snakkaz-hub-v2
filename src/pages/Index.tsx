
import { Header } from "@/components/index/Header";
import { Footer } from "@/components/index/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectGrid } from "@/components/index/ProjectGrid";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-cyberdark-950 overflow-x-hidden">
      <div className="relative min-h-screen flex flex-col p-2 md:p-4">
        <div className="absolute inset-0 overflow-hidden">
          {/* Enhanced background effects */}
          <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-r from-cyberblue-500/30 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-l from-cyberblue-500/30 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
          {/* Additional subtle light effects */}
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-cyberblue-400/10 rounded-full filter blur-2xl animate-pulse-slow delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-cyberblue-300/10 rounded-full filter blur-xl animate-pulse-slow delay-500"></div>
        </div>

        <div className="container mx-auto px-2 md:px-4 relative z-10 flex-grow">
          <Header />
          <ProjectGrid />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
