
import { Header } from "@/components/index/Header";
import { Footer } from "@/components/index/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectGrid } from "@/components/index/ProjectGrid";
import { ProgressSection } from "@/components/index/ProgressSection";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  return (
    <div className="min-h-screen bg-cyberdark-950 overflow-x-hidden">
      <div className="relative min-h-screen flex flex-col p-2 md:p-4">
        <div className="absolute inset-0 overflow-hidden">
          {/* Enhanced background effects with red/blue gradient */}
          <div className="absolute top-0 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-r from-cyberblue-500/30 to-transparent rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-l from-red-500/30 to-transparent rounded-full filter blur-3xl animate-pulse-slow delay-200"></div>
          {/* Additional subtle light effects */}
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-cyberblue-400/10 rounded-full filter blur-2xl animate-pulse-slow delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-red-300/10 rounded-full filter blur-xl animate-pulse-slow delay-500"></div>
          
          {/* Gradient background overlay for white areas */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyberblue-900/5 via-transparent to-red-900/5 pointer-events-none"></div>
        </div>

        <div className="container mx-auto px-2 md:px-4 relative z-10 flex-grow">
          <Header />
          <ProjectGrid />
          <ProgressSection />

          {/* Download app button */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={() => setShowDownloadDialog(true)}
              className="rounded-full w-16 h-16 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #1a9dff 0%, #3b82f6 50%, #d62828 100%)',
                boxShadow: '0 0 20px rgba(26,157,255,0.5), 0 0 20px rgba(214,40,40,0.5)'
              }}
            >
              <Download size={24} />
            </Button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Download App Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="bg-cyberdark-900 border-2 sm:max-w-md"
          style={{ borderImage: "linear-gradient(90deg, #1a9dff, #d62828) 1" }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold text-center"
              style={{
                background: 'linear-gradient(90deg, #1a9dff 0%, #ffffff 50%, #d62828 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Last ned SnakkaZ App
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Få sikker kommunikasjon hvor som helst
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="flex items-center justify-center">
              <img 
                src="/snakkaz-logo.png" 
                alt="SnakkaZ Logo" 
                className="h-24 w-24 rounded-full border-2 p-1"
                style={{ borderImage: "linear-gradient(90deg, #1a9dff, #d62828) 1" }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="w-full bg-gradient-to-r from-cyberblue-500 to-cyberblue-700 hover:from-cyberblue-600 hover:to-cyberblue-800"
                onClick={() => window.open('/manifest.json', '_blank')}
              >
                <Download className="mr-2" size={16} /> Android
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                onClick={() => window.open('/manifest.json', '_blank')}
              >
                <Download className="mr-2" size={16} /> iOS
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-2">
              Installer appen for en bedre brukeropplevelse og påminnelser
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
