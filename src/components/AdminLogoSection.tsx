
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const AdminLogoSection = () => {
  const [logoSize, setLogoSize] = useState(() => {
    return parseInt(localStorage.getItem("logoSize") || "50");
  });
  const [showLogo, setShowLogo] = useState(() => {
    return localStorage.getItem("showLogo") !== "false";
  });
  const [logoStyle, setLogoStyle] = useState(() => {
    return localStorage.getItem("logoStyle") || "circle";
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(() => {
    return localStorage.getItem("logoUrl") || "/snakkaz-logo.png";
  });

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      localStorage.setItem("logoUrl", imageUrl);
      toast({
        title: "Bilde lastet opp",
        description: "Nytt bilde er klart til bruk",
      });
    }
  };

  const handleLogoSizeChange = (values: number[]) => {
    setLogoSize(values[0]);
    localStorage.setItem("logoSize", values[0].toString());
  };

  const handleLogoStyleChange = (style: string) => {
    setLogoStyle(style);
    localStorage.setItem("logoStyle", style);
  };

  const handleShowLogoChange = (show: boolean) => {
    setShowLogo(show);
    localStorage.setItem("showLogo", show.toString());
  };

  const handleRemoveLogo = () => {
    setPreviewUrl("/placeholder.svg");
    setSelectedFile(null);
    localStorage.setItem("logoUrl", "/placeholder.svg");
    toast({
      title: "Bilde fjernet",
      description: "Standard plassholder bilde vises nå",
    });
  };

  return (
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
            value={[logoSize]}
            min={30}
            max={100}
            step={5}
            onValueChange={handleLogoSizeChange}
            className="py-4"
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
            onCheckedChange={handleShowLogoChange}
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
              onClick={() => handleLogoStyleChange("circle")}
              className={logoStyle === "circle" ? "bg-red-500/20 border-red-500" : ""}
            >
              Sirkel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLogoStyleChange("square")}
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
  );
};
