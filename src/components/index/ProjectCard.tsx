
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GithubIcon, ExternalLink, Database, RefreshCw } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export interface ProjectProps {
  title: string;
  description: string;
  previewUrl: string;
  githubUrl?: string;
  category: 'chat' | 'business' | 'analytics' | 'infrastructure';
  hasSupabase?: boolean;
}

export const ProjectCard = ({ title, description, previewUrl, githubUrl, category, hasSupabase }: ProjectProps) => {
  const [refreshKey, setRefreshKey] = useState(0); // State to force image refresh
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chat':
        return 'border-cyberblue-500';
      case 'business':
        return 'border-cyberblue-500';
      case 'analytics':
        return 'border-green-500';
      case 'infrastructure':
        return 'border-purple-500';
      default:
        return 'border-gray-500';
    }
  };

  // Function to refresh the preview image
  const refreshPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setImageError(false);
    setRefreshKey(prev => prev + 1);
  };
  
  // Handle card click - for SnakkaZ Guardian Chat navigate to chat page, others open in new tab
  const handleCardClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    
    if (title === "SnakkaZ Guardian Chat") {
      navigate('/chat');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Determine the thumbnail URL based on the previewUrl with a cache-busting parameter
  const thumbnailUrl = `${previewUrl.replace('https://preview--', 'https://thumbnail--')}/thumbnail.png?t=${refreshKey}&cache=${new Date().getTime()}`;

  return (
    <Card className={`h-full bg-cyberdark-900 border-2 ${getCategoryColor(category)} hover:shadow-neon-blue transition-all duration-300`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-cyberblue-400 text-xl flex items-center justify-between">
          {title}
          {hasSupabase && (
            <Badge variant="outline" className="ml-2 bg-green-900/40 text-green-300 border-green-500/30 flex items-center gap-1 px-2 shadow-[0_0_8px_rgba(34,197,94,0.3)]">
              <Database size={14} className="text-green-400 animate-pulse" />
              Supabase
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-gray-300 text-sm space-y-4">
        <div className="overflow-hidden rounded-md border border-cyberdark-800 bg-cyberdark-800 relative group">
          <AspectRatio ratio={16/9} className="bg-cyberdark-800">
            <a 
              href={previewUrl}
              onClick={(e) => handleCardClick(e, previewUrl)}
              className="block w-full h-full relative group"
            >
              {!imageError ? (
                <img 
                  key={refreshKey} // Use key to force reload of image when refreshed
                  src={thumbnailUrl}
                  alt={`Preview of ${title}`}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.log(`Image failed to load for ${title}, using SnakkaZ logo as fallback`);
                    setImageError(true);
                    (e.target as HTMLImageElement).src = "/snakkaz-logo.png";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cyberdark-950">
                  <img 
                    src="/snakkaz-logo.png" 
                    alt="SnakkaZ Logo" 
                    className="h-12 object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-cyberdark-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="text-cyberblue-400 flex items-center">
                  <ExternalLink size={20} className="mr-2" />
                  {title === "SnakkaZ Guardian Chat" ? "Open Chat" : "Preview Site"}
                </span>
              </div>
            </a>
          </AspectRatio>
          <button 
            className="absolute top-2 right-2 bg-cyberdark-900/80 p-1 rounded-full text-cyberblue-400 hover:text-cyberblue-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={refreshPreview}
            title="Refresh preview"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        
        <p>{description}</p>
      </CardContent>
      
      <CardFooter className="flex justify-between mt-auto pt-4">
        <a
          href={title === "SnakkaZ Guardian Chat" ? "/chat" : previewUrl}
          onClick={(e) => {
            e.preventDefault();
            if (title === "SnakkaZ Guardian Chat") {
              navigate('/chat');
            } else {
              window.open(previewUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="flex items-center text-cyberblue-400 hover:text-cyberblue-300 text-sm transition-colors"
        >
          <ExternalLink size={16} className="mr-1" />
          {title === "SnakkaZ Guardian Chat" ? "Open Chat" : "Preview"}
        </a>
        
        {githubUrl ? (
          <a
            href={githubUrl}
            onClick={(e) => {
              e.preventDefault();
              window.open(githubUrl, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center text-cyberblue-400 hover:text-cyberblue-300 text-sm transition-colors"
          >
            <GithubIcon size={16} className="mr-1" />
            GitHub
          </a>
        ) : (
          <span className="text-gray-500 text-sm italic">Private Repo</span>
        )}
      </CardFooter>
    </Card>
  );
};
