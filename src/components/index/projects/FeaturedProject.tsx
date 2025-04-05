
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ExternalLink, Database, RefreshCw, HelpCircle } from "lucide-react";
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
  const thumbnailUrl = `${project.previewUrl.replace('https://preview--', 'https://thumbnail--')}/thumbnail.png?t=${refreshKey}&cache=${new Date().getTime()}`;
  
  return (
    <div className="mb-12 bg-gradient-to-r from-cyberdark-800 to-cyberdark-900 border-2 border-cyberblue-500 rounded-lg p-6 shadow-neon-blue">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-cyberblue-400">Featured Project: {project.title}</h2>
            <Button
              variant="outline"
              size="sm"
              className="border-cyberblue-500 text-cyberblue-400 hover:bg-cyberblue-900/50"
              onClick={() => setShowHelpDesk(true)}
            >
              <HelpCircle size={16} className="mr-2" />
              Help
            </Button>
          </div>
          <p className="text-gray-300 mb-6">{project.description}</p>
          
          <div className="flex gap-4">
            <Button 
              className="bg-cyberblue-500 hover:bg-cyberblue-600 text-white" 
              onClick={handleChatRedirect}
            >
              Try Chat Now
            </Button>
            
            <Button 
              variant="outline" 
              className="border-cyberblue-500 text-cyberblue-400 hover:bg-cyberblue-900/50"
              onClick={(e) => {
                e.preventDefault();
                window.open(project.previewUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink size={16} className="mr-2" />
              Preview Site
            </Button>
          </div>
          
          {project.hasSupabase && (
            <div className="mt-4 flex items-center text-green-300">
              <Database size={16} className="mr-2 text-green-400 animate-pulse" />
              <span className="bg-green-900/40 text-green-300 border border-green-500/30 px-2 py-1 rounded-md text-xs shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                Supabase Integration
              </span>
            </div>
          )}
        </div>
        
        <div className="md:w-1/2">
          <div className="overflow-hidden rounded-md border-2 border-cyberblue-500/50 shadow-lg relative group">
            <AspectRatio ratio={16/9} className="bg-cyberdark-800">
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
                className="absolute inset-0 bg-cyberdark-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer"
                onClick={handleChatRedirect}
              >
                <span className="text-cyberblue-400 flex items-center">
                  <ExternalLink size={20} className="mr-2" />
                  Open Chat
                </span>
              </div>
              <button 
                className="absolute top-2 right-2 bg-cyberdark-900/80 p-1 rounded-full text-cyberblue-400 hover:text-cyberblue-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
              className="h-16 object-contain" 
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
