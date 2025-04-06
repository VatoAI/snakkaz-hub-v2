
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ExternalLink, Database, RefreshCw, HelpCircle, MessageSquare } from "lucide-react";
import { ProjectProps } from "../ProjectCard";
import { HelpDeskDialog } from "./HelpDeskDialog";

interface FeaturedProjectProps {
  project: (ProjectProps & { isFeatured?: boolean }) | undefined;
}

export const FeaturedProject = ({ project }: FeaturedProjectProps) => {
  const [refreshKey, setRefreshKey] = useState(0); // State to force image refresh
  const [showHelpDesk, setShowHelpDesk] = useState(false);
  const navigate = useNavigate();
  
  if (!project) return null;
  
  // Function to refresh the preview image
  const refreshPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRefreshKey(prev => prev + 1);
  };
  
  const handleChatRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/chat');
  };
  
  // Thumbnail URL with cache busting
  const thumbnailUrl = `${project.previewUrl.replace('https://', 'https://thumbnail--')}/thumbnail.png?t=${refreshKey}&cache=${new Date().getTime()}`;
  
  return (
    <div className="mb-12 bg-gradient-to-r from-cyberdark-800/90 to-cyberdark-900/90 backdrop-blur-sm border-2 border-cyberblue-500/60 rounded-xl p-6 sm:p-8 shadow-[0_0_30px_rgba(26,157,255,0.15)]">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
        <div className="md:w-1/2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-cyberblue-300 flex items-center">
              <span className="bg-cyberblue-500/20 p-1.5 rounded-lg mr-3">
                <MessageSquare size={24} className="text-cyberblue-400" />
              </span>
              {project.title}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="border-cyberblue-500/70 text-cyberblue-400 hover:bg-cyberblue-900/50"
              onClick={() => setShowHelpDesk(true)}
            >
              <HelpCircle size={16} className="mr-2" />
              Hjelp
            </Button>
          </div>
          <p className="text-gray-300 mb-6 text-base sm:text-lg">{project.description}</p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              className="bg-cyberblue-500 hover:bg-cyberblue-600 text-white font-medium px-6 py-5 h-auto text-base"
              onClick={handleChatRedirect}
            >
              <MessageSquare size={18} className="mr-2" />
              Prøv Chat Nå
            </Button>
            
            <Button 
              variant="outline" 
              className="border-cyberblue-500/70 text-cyberblue-400 hover:bg-cyberblue-900/50 h-auto py-2"
              onClick={(e) => {
                e.preventDefault();
                window.open(project.previewUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink size={16} className="mr-2" />
              Se Live Preview
            </Button>
          </div>
          
          {project.hasSupabase && (
            <div className="mt-6 flex items-center">
              <span className="bg-green-900/40 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-md text-sm shadow-[0_0_8px_rgba(34,197,94,0.3)] flex items-center">
                <Database size={14} className="mr-2 text-green-400 animate-pulse" />
                Supabase Integration
              </span>
            </div>
          )}
        </div>
        
        <div className="md:w-1/2">
          <div className="overflow-hidden rounded-lg border-2 border-cyberblue-500/60 shadow-lg relative group bg-cyberdark-950/50">
            <AspectRatio ratio={16/9}>
              <img 
                key={refreshKey} // Use key to force reload of image when refreshed
                src={thumbnailUrl}
                alt={`Preview of ${project.title}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.log("Image failed to load, using SnakkaZ logo as fallback");
                  (e.target as HTMLImageElement).src = "/snakkaz-logo.png";
                }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-cyberdark-950/90 via-cyberdark-950/40 to-transparent opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer"
                onClick={handleChatRedirect}
              >
                <div className="text-center p-4">
                  <span className="text-cyberblue-300 font-medium flex items-center justify-center mb-2">
                    <ExternalLink size={20} className="mr-2" />
                    Åpne Chat
                  </span>
                  <p className="text-cyberblue-400/80 text-sm max-w-xs mx-auto">
                    Klikk for å prøve SnakkaZ Chat med ende-til-ende-kryptering
                  </p>
                </div>
              </div>
              <button 
                className="absolute top-2 right-2 bg-cyberdark-900/80 p-1.5 rounded-full text-cyberblue-400 hover:text-cyberblue-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={refreshPreview}
                title="Refresh preview"
              >
                <RefreshCw size={16} />
              </button>
            </AspectRatio>
          </div>
          
          <div className="mt-4 flex justify-center items-center">
            <img 
              src="/snakkaz-logo.png" 
              alt="SnakkaZ Logo" 
              className="h-16 object-contain rounded-full border border-cyberblue-500/30 p-1 bg-cyberdark-900/50" 
              onError={(e) => {
                console.log("Logo failed to load, using placeholder");
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        </div>
      </div>
      
      <HelpDeskDialog open={showHelpDesk} onOpenChange={setShowHelpDesk} />
    </div>
  );
};
