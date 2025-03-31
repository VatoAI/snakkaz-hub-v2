
import { ProjectCard, ProjectProps } from "./ProjectCard";

// Project data
const projects: ProjectProps[] = [
  // Chat Projects
  {
    title: "SnakkaZ Guardian Chat",
    description: "Secure chat application with advanced encryption and privacy features",
    previewUrl: "https://preview--snakkaz-guardian-chat.lovable.app/",
    githubUrl: "https://github.com/VatoAI/snakkaz-guardian-chat.git",
    category: "chat"
  },
  {
    title: "ChatCipher Assistant",
    description: "Encrypted messaging platform with AI-powered assistant capabilities",
    previewUrl: "https://preview--chatcipher-assistant.lovable.app/",
    githubUrl: "https://github.com/VatoAI/chatcipher-assistant.git",
    category: "chat"
  },
  {
    title: "Stealthy Convo",
    description: "Private conversation platform with ephemeral messaging",
    previewUrl: "https://preview--stealthy-convo.lovable.app/",
    category: "chat"
  },
  
  // Business Tools
  {
    title: "MatTilbud",
    description: "Food deal finder and grocery shopping assistant",
    previewUrl: "https://preview--mattilbud.lovable.app/",
    githubUrl: "https://github.com/VatoAI/mattilbud.git",
    category: "business"
  },
  {
    title: "MatTilbudBetter",
    description: "Enhanced version of the food deal platform with additional features",
    previewUrl: "https://preview--mattilbudbetter.lovable.app/",
    githubUrl: "https://github.com/VatoAI/mattilbudbetter.git",
    category: "business"
  },
  {
    title: "Budget Basket Helper",
    description: "Budget planning and shopping optimization tool",
    previewUrl: "https://preview--budget-basket-helper.lovable.app/",
    githubUrl: "https://github.com/VatoAI/budget-basket-helper.git",
    category: "business"
  },
  {
    title: "Norwegian Business Insights",
    description: "Business intelligence platform for Norwegian market",
    previewUrl: "https://preview--norwegian-business-insights.lovable.app/",
    category: "business"
  },
  
  // Analytics Projects
  {
    title: "Norsk Crypto Insight",
    description: "Cryptocurrency analytics platform with Norwegian market focus",
    previewUrl: "https://preview--norsk-crypto-insight.lovable.app/",
    githubUrl: "https://github.com/VatoAI/norsk-crypto-insight.git",
    category: "analytics"
  },
  {
    title: "Crypto Perplexity Analytica",
    description: "Advanced crypto market analysis and prediction tools",
    previewUrl: "https://preview--crypto-perplexity-analytica.lovable.app/",
    githubUrl: "https://github.com/VatoAI/crypto-perplexity-analytica.git",
    category: "analytics"
  },
  {
    title: "Info Summit Dash",
    description: "Information dashboard with visualization and analysis tools",
    previewUrl: "https://preview--info-summit-dash.lovable.app/",
    githubUrl: "https://github.com/VatoAI/info-summit-dash.git",
    category: "analytics"
  },
  {
    title: "AI Dash Hub",
    description: "AI-powered analytics dashboard with predictive capabilities",
    previewUrl: "https://preview--ai-dash-hub.lovable.app/",
    githubUrl: "https://github.com/VatoAI/ai-dash-hub.git",
    category: "analytics"
  },
  
  // Infrastructure
  {
    title: "Query Gateway Symphony",
    description: "Advanced query processing and data orchestration service",
    previewUrl: "https://preview--query-gateway-symphony.lovable.app/",
    category: "infrastructure"
  },
  {
    title: "SecurePeer CryptoService",
    description: "Secure peer-to-peer cryptographic service platform",
    previewUrl: "https://preview--securepeer-cryptoservice.lovable.app/",
    category: "infrastructure"
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

export const ProjectGrid = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
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
