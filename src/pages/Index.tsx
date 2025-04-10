import { Header } from "@/components/index/Header";
import { Footer } from "@/components/index/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProjectGrid } from "@/components/index/ProjectGrid";
import { ProgressSection } from "@/components/index/ProgressSection";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Info, Smartphone, Laptop, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const isMobile = useIsMobile();
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [showInstallTip, setShowInstallTip] = useState(false);
  const [installationComplete, setInstallationComplete] = useState(false);
  const { toast } = useToast();

  // Handle PWA install events
  useEffect(() => {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }
    
    // Save the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // Show install tip after 5 seconds if not already installed
      setTimeout(() => {
        if (!isPWAInstalled) {
          setShowInstallTip(true);
        }
      }, 5000);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Clean up
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isPWAInstalled]);
  
  // Handle install for browser/desktop
  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        // Show the install prompt
        await installPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          toast({
            title: "Installasjon startet",
            description: "Takk for at du installerer SnakkaZ Hub!",
          });
          setIsPWAInstalled(true);
          setInstallationComplete(true);
        }
        
        // Reset the installPrompt - it can only be used once
        setInstallPrompt(null);
      } catch (err) {
        console.error('Installation error:', err);
        toast({
          title: "Installasjonen mislyktes",
          description: "Prøv å oppdatere siden og prøv på nytt.",
          variant: "destructive",
        });
      }
    } else {
      setShowDownloadDialog(false);
    }
  };
  
  // iOS Safari-specific instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isWindows = /Windows/.test(navigator.userAgent);
  const isMac = /Mac/.test(navigator.userAgent) && !isIOS;
  const isLinux = /Linux/.test(navigator.userAgent) && !isAndroid;

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

          {/* Download app button - only show if not already installed */}
          {!isPWAInstalled && (
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
          )}
          
          {/* Installation tip toast */}
          {showInstallTip && (
            <div className="fixed bottom-24 right-6 z-50 max-w-xs bg-cyberdark-800 p-4 rounded-lg shadow-lg border border-cyberblue-500/30 animate-fade-in">
              <button 
                onClick={() => setShowInstallTip(false)} 
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
              <div className="flex items-start mb-2">
                <Info className="mr-2 text-cyberblue-400 mt-0.5 flex-shrink-0" size={18} />
                <h4 className="text-sm font-semibold text-cyberblue-300">Visste du at?</h4>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Du kan installere SnakkaZ som en app på enheten din for raskere tilgang og bedre opplevelse.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowInstallTip(false);
                  setShowDownloadDialog(true);
                }}
                className="w-full text-xs border-cyberblue-500/50 text-cyberblue-400"
              >
                <Download size={12} className="mr-1" /> Installer App
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Download App Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="bg-cyberdark-900 border-2 sm:max-w-md overflow-y-auto max-h-[90vh]"
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
          
          {installationComplete ? (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-900/30 p-4 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-white">Installasjon Fullført!</h3>
              <p className="text-gray-400">SnakkaZ er nå installert på enheten din</p>
              <Button 
                className="mt-4 bg-gradient-to-r from-cyberblue-500 to-cyberblue-700"
                onClick={() => setShowDownloadDialog(false)}
              >
                Lukk
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              <div className="flex items-center justify-center">
                <img 
                  src="/snakkaz-logo.png" 
                  alt="SnakkaZ Logo" 
                  className="h-24 w-24 rounded-full border-2 p-1"
                  style={{ borderImage: "linear-gradient(90deg, #1a9dff, #d62828) 1" }}
                />
              </div>
              
              <Tabs defaultValue={isIOS ? "ios" : isAndroid ? "android" : "desktop"} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="desktop" className="flex items-center">
                    <Laptop className="mr-2 h-4 w-4" /> Desktop
                  </TabsTrigger>
                  <TabsTrigger value="ios" className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" /> iOS
                  </TabsTrigger>
                  <TabsTrigger value="android" className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" /> Android
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="desktop" className="space-y-4">
                  {installPrompt ? (
                    <Button 
                      className="w-full bg-gradient-to-r from-cyberblue-500 to-cyberblue-700 hover:from-cyberblue-600 hover:to-cyberblue-800 py-6"
                      onClick={handleInstallClick}
                    >
                      <Laptop className="mr-2" size={18} /> Installer på Denne Enheten
                    </Button>
                  ) : (
                    <div className="bg-cyberdark-800 p-4 rounded-md text-sm text-gray-300 space-y-4">
                      <p className="flex items-center text-white font-semibold">
                        <Info className="mr-2" size={16} /> Installasjon på {
                          isWindows ? "Windows" : isMac ? "macOS" : isLinux ? "Linux" : "Desktop"
                        }:
                      </p>
                      
                      <ol className="list-decimal pl-5 space-y-2 text-xs">
                        <li>Klikk på menyknappen (⋮) i nettleseren</li>
                        <li>Velg "Installer app" eller "Legg til på startskjermen"</li>
                        <li>Følg instruksjonene for å fullføre installasjonen</li>
                      </ol>
                      
                      <div className="pt-2">
                        <Button
                          variant="outline" 
                          size="sm"
                          className="w-full border-cyberblue-500/50 text-cyberblue-400"
                          onClick={() => window.location.reload()}
                        >
                          <RefreshCw size={14} className="mr-2" /> Oppdater siden for å aktivere installasjon
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="ios" className="space-y-4">
                  <div className="bg-cyberdark-800 p-4 rounded-md text-sm text-gray-300 space-y-3">
                    <p className="font-semibold text-white flex items-center">
                      <Smartphone className="mr-2" size={16} /> For iOS:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-xs">
                      <li>Trykk på Del-ikonet (firkant med pil opp) i Safari</li>
                      <li>Scroll ned og trykk <span className="font-semibold">Legg til på Hjem-skjerm</span></li>
                      <li>Trykk <span className="font-semibold">Legg til</span> i øvre høyre hjørne</li>
                      <li>SnakkaZ-appen vil nå vises på din hjemskjerm</li>
                    </ol>
                    
                    <div className="mt-3 flex justify-center">
                      <img 
                        src="/ios-install-guide.png" 
                        alt="iOS Installation Guide" 
                        className="max-w-full h-auto rounded-md border border-gray-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="android" className="space-y-4">
                  <div className="bg-cyberdark-800 p-4 rounded-md text-sm text-gray-300 space-y-3">
                    <p className="font-semibold text-white flex items-center">
                      <Smartphone className="mr-2" size={16} /> For Android:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-xs">
                      <li>Trykk på menyknappen (⋮) i Chrome</li>
                      <li>Velg <span className="font-semibold">Installer app</span> eller <span className="font-semibold">Legg til på startskjerm</span></li>
                      <li>Trykk <span className="font-semibold">Installer</span> i dialogen som vises</li>
                      <li>SnakkaZ vil nå vises i din app-skuff</li>
                    </ol>
                    
                    {installPrompt && (
                      <div className="pt-3">
                        <Button 
                          className="w-full bg-gradient-to-r from-cyberblue-500 to-cyberblue-700 hover:from-cyberblue-600 hover:to-cyberblue-800"
                          onClick={handleInstallClick}
                        >
                          <Download className="mr-2" size={16} /> Installer SnakkaZ på Android
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-4 space-y-4">
                <div className="text-center">
                  <h4 className="text-sm font-medium text-white mb-2">Fordeler med app-installasjon:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className="flex items-center">
                      <CheckCircle size={12} className="text-green-500 mr-2" />
                      Full-skjerm opplevelse uten nettleser-elementer
                    </li>
                    <li className="flex items-center">
                      <CheckCircle size={12} className="text-green-500 mr-2" />
                      Raskere lastehastighet og offline-tilgang
                    </li>
                    <li className="flex items-center">
                      <CheckCircle size={12} className="text-green-500 mr-2" />
                      Bedre ytelse og batterieffektivitet
                    </li>
                    <li className="flex items-center">
                      <CheckCircle size={12} className="text-green-500 mr-2" />
                      Push-varsler for nye meldinger og hendelser
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs border-gray-700 text-gray-400 hover:text-white"
                    onClick={() => setShowDownloadDialog(false)}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
