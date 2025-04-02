
import { ProjectCard, ProjectProps } from "./ProjectCard";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ExternalLink, CheckCircle, Database } from "lucide-react";

// Project data
const projects: (ProjectProps & { isFeatured?: boolean })[] = [
  // Chat Projects
  {
    title: "SnakkaZ Guardian Chat",
    description: "Secure chat application with advanced encryption and privacy features",
    previewUrl: "https://preview--snakkaz-guardian-chat.lovable.app/",
    githubUrl: "https://github.com/VatoAI/snakkaz-guardian-chat.git",
    category: "chat",
    hasSupabase: true,
    isFeatured: true
  },
  {
    title: "ChatCipher Assistant",
    description: "Encrypted messaging platform with AI-powered assistant capabilities",
    previewUrl: "https://preview--chatcipher-assistant.lovable.app/",
    githubUrl: "https://github.com/VatoAI/chatcipher-assistant.git",
    category: "chat",
    hasSupabase: true
  },
  {
    title: "Stealthy Convo",
    description: "Private conversation platform with ephemeral messaging",
    previewUrl: "https://preview--stealthy-convo.lovable.app/",
    category: "chat",
    hasSupabase: false
  },
  
  // Business Tools
  {
    title: "MatTilbud",
    description: "Food deal finder and grocery shopping assistant",
    previewUrl: "https://preview--mattilbud.lovable.app/",
    githubUrl: "https://github.com/VatoAI/mattilbud.git",
    category: "business",
    hasSupabase: true
  },
  {
    title: "MatTilbudBetter",
    description: "Enhanced version of the food deal platform with additional features",
    previewUrl: "https://preview--mattilbudbetter.lovable.app/",
    githubUrl: "https://github.com/VatoAI/mattilbudbetter.git",
    category: "business",
    hasSupabase: true
  },
  {
    title: "Budget Basket Helper",
    description: "Budget planning and shopping optimization tool",
    previewUrl: "https://preview--budget-basket-helper.lovable.app/",
    githubUrl: "https://github.com/VatoAI/budget-basket-helper.git",
    category: "business",
    hasSupabase: false
  },
  {
    title: "Norwegian Business Insights",
    description: "Business intelligence platform for Norwegian market",
    previewUrl: "https://preview--norwegian-business-insights.lovable.app/",
    category: "business",
    hasSupabase: true
  },
  
  // Analytics Projects
  {
    title: "Norsk Crypto Insight",
    description: "Cryptocurrency analytics platform with Norwegian market focus",
    previewUrl: "https://preview--norsk-crypto-insight.lovable.app/",
    githubUrl: "https://github.com/VatoAI/norsk-crypto-insight.git",
    category: "analytics",
    hasSupabase: true
  },
  {
    title: "Crypto Perplexity Analytica",
    description: "Advanced crypto market analysis and prediction tools",
    previewUrl: "https://preview--crypto-perplexity-analytica.lovable.app/",
    githubUrl: "https://github.com/VatoAI/crypto-perplexity-analytica.git",
    category: "analytics",
    hasSupabase: true
  },
  {
    title: "Info Summit Dash",
    description: "Information dashboard with visualization and analysis tools",
    previewUrl: "https://preview--info-summit-dash.lovable.app/",
    githubUrl: "https://github.com/VatoAI/info-summit-dash.git",
    category: "analytics",
    hasSupabase: false
  },
  {
    title: "AI Dash Hub",
    description: "AI-powered analytics dashboard with predictive capabilities",
    previewUrl: "https://preview--ai-dash-hub.lovable.app/",
    githubUrl: "https://github.com/VatoAI/snakkaz-guardian-chat.git",
    category: "analytics",
    hasSupabase: true
  },
  
  // Infrastructure
  {
    title: "Query Gateway Symphony",
    description: "Advanced query processing and data orchestration service",
    previewUrl: "https://preview--query-gateway-symphony.lovable.app/",
    category: "infrastructure",
    hasSupabase: true
  },
  {
    title: "SecurePeer CryptoService",
    description: "Secure peer-to-peer cryptographic service platform",
    previewUrl: "https://preview--securepeer-cryptoservice.lovable.app/",
    category: "infrastructure",
    hasSupabase: true
  }
];

// Helper function to filter projects by category
const filterProjectsByCategory = (category: ProjectProps['category']) => {
  return projects.filter(project => project.category === category);
};

interface CategorySectionProps {
  title: string;
  category: ProjectProps['category'];
}

const CategorySection = ({ title, category }: CategorySectionProps) => {
  const categoryProjects = filterProjectsByCategory(category);
  
  if (categoryProjects.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-12">
      <h2 className="text-cybergold-400 text-2xl font-bold mb-4 border-b border-cybergold-500/30 pb-2">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryProjects.map((project) => (
          <ProjectCard key={project.previewUrl} {...project} />
        ))}
      </div>
    </div>
  );
};

// Featured Project Component
const FeaturedProject = () => {
  const featuredProject = projects.find(p => p.isFeatured);
  
  if (!featuredProject) return null;
  
  return (
    <div className="mb-12 bg-gradient-to-r from-cyberdark-800 to-cyberdark-900 border-2 border-cyberblue-500 rounded-lg p-6 shadow-neon-blue">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <h2 className="text-3xl font-bold text-cyberblue-400 mb-4">Featured Project: {featuredProject.title}</h2>
          <p className="text-gray-300 mb-6">{featuredProject.description}</p>
          
          <div className="flex gap-4">
            <Button 
              className="bg-cyberblue-500 hover:bg-cyberblue-600 text-white" 
              onClick={() => window.open('/chat', '_self')}
            >
              Try Chat Now
            </Button>
            
            <Button 
              variant="outline" 
              className="border-cyberblue-500 text-cyberblue-400 hover:bg-cyberblue-900/50"
              onClick={() => window.open(featuredProject.previewUrl, '_blank')}
            >
              <ExternalLink size={16} className="mr-2" />
              Preview Site
            </Button>
          </div>
          
          {featuredProject.hasSupabase && (
            <div className="mt-4 flex items-center text-cyberblue-300">
              <CheckCircle size={16} className="mr-2" />
              Connected with Supabase
            </div>
          )}
        </div>
        
        <div className="md:w-1/2">
          <div className="overflow-hidden rounded-md border-2 border-cyberblue-500/50 shadow-lg">
            <AspectRatio ratio={16/9} className="bg-cyberdark-800">
              <img 
                src={`${featuredProject.previewUrl.replace('https://preview--', 'https://thumbnail--')}/thumbnail.png`}
                alt={`Preview of ${featuredProject.title}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </AspectRatio>
          </div>
          
          <div className="mt-2 text-center">
            <img 
              src="https://snakkaz.com/wp-content/uploads/2023/10/SnakkaZ_Main_Logo.png" 
              alt="SnakkaZ Logo" 
              className="h-12 mx-auto" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectGrid = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <FeaturedProject />
      
      <h1 className="text-3xl font-bold text-center text-cybergold-500 mb-8">Lovable Prosjekter</h1>
      
      <CategorySection title="Kommunikasjon" category="chat" />
      <CategorySection title="Forretningsverktøy" category="business" />
      <CategorySection title="Analyse & Innsikt" category="analytics" />
      <CategorySection title="Infrastruktur" category="infrastructure" />
      
      <div className="mt-10 text-center">
        <a 
          href="/chat"
          className="inline-block bg-cybergold-500 hover:bg-cybergold-600 text-cyberdark-950 px-6 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Lokal chat versjon
        </a>
      </div>
    </div>
  );
};
