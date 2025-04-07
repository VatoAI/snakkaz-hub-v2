
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Image, Key, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Admin = () => {
  const [apiKey, setApiKey] = useState("");
  const [logoSize, setLogoSize] = useState(50);
  const [showLogo, setShowLogo] = useState(true);
  const [logoStyle, setLogoStyle] = useState("circle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("/snakkaz-logo.png");

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      toast({
        title: "Bilde lastet opp",
        description: "Nytt bilde er klart til bruk",
      });
    }
  };

  const handleLogoSizeChange = (values: number[]) => {
    setLogoSize(values[0]);
  };

  const handleApiKeySave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Feil",
        description: "API nøkkel kan ikke være tom",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("aiHelpApiKey", apiKey);
    toast({
      title: "Lagret!",
      description: "API nøkkel har blitt lagret",
    });
  };

  const handleRemoveLogo = () => {
    setPreviewUrl("/placeholder.svg");
    setSelectedFile(null);
    toast({
      title: "Bilde fjernet",
      description: "Standard plassholder bilde vises nå",
    });
  };

  return (
    <div className="min-h-screen bg-cyberdark-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            className="mr-4" 
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="mr-2" size={20} /> Tilbake
          </Button>
          <h1 
            className="text-3xl font-bold"
            style={{
              background: 'linear-gradient(90deg, #1a9dff 0%, #ffffff 50%, #d62828 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '-3px 0 10px rgba(26,157,255,0.5), 3px 0 10px rgba(214,40,40,0.5)',
            }}
          >
            Admin Panel
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Help API Key Section */}
          <div 
            className="p-6 rounded-xl bg-gradient-to-r from-cyberdark-900/90 to-cyberdark-800/90"
            style={{
              borderImage: 'linear-gradient(90deg, #1a9dff, #d62828) 1',
              border: '2px solid',
            }}
          >
            <div className="flex items-center mb-4">
              <Key className="mr-3 text-cyberblue-400" size={24} />
              <h2 className="text-xl font-semibold text-cyberblue-300">HelpDesk API Nøkkel</h2>
            </div>
            
            <p className="mb-4 text-gray-400">
              Legg til en API nøkkel for å aktivere AI hjelp i HelpDesk.
            </p>
            
            <div className="space-y-4">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Skriv inn API nøkkel"
                className="bg-cyberdark-950 border-cyberblue-500/30"
              />
              
              <Button
                onClick={handleApiKeySave}
                className="w-full"
                style={{
                  background: 'linear-gradient(90deg, #1a9dff, #3b82f6)',
                  boxShadow: '0 0 10px rgba(26,157,255,0.4)',
                }}
              >
                Lagre API Nøkkel
              </Button>
            </div>
          </div>

          {/* Logo Management Section */}
          <div 
            className="p-6 rounded-xl bg-gradient-to-r from-cyberdark-900/90 to-cyberdark-800/90"
            style={{
              borderImage: 'linear-gradient(90deg, #d62828, #1a9dff) 1',
              border: '2px solid',
            }}
          >
            <div className="flex items-center mb-4">
              <Image className="mr-3 text-red-400" size={24} />
              <h2 className="text-xl font-semibold text-red-300">Logo Innstillinger</h2>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div 
                className={`relative overflow-hidden ${logoStyle === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
                style={{ width: `${logoSize}%`, maxWidth: '200px' }}
              >
                <img
                  src={previewUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="logoFile" className="block mb-2 text-gray-300">
                  Last opp nytt logo
                </Label>
                <Input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-cyberdark-950 border-red-500/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Logo størrelse</Label>
                <Slider
                  defaultValue={[logoSize]}
                  min={30}
                  max={100}
                  step={5}
                  onValueChange={handleLogoSizeChange}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>30%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showLogo" className="text-gray-300">
                  Vis logo
                </Label>
                <Switch
                  id="showLogo"
                  checked={showLogo}
                  onCheckedChange={setShowLogo}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="logoStyle" className="text-gray-300">
                  Logo stil
                </Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoStyle("circle")}
                    className={logoStyle === "circle" ? "bg-red-500/20 border-red-500" : ""}
                  >
                    Sirkel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoStyle("square")}
                    className={logoStyle === "square" ? "bg-red-500/20 border-red-500" : ""}
                  >
                    Firkant
                  </Button>
                </div>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleRemoveLogo}
                className="w-full"
              >
                Fjern Logo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
