
import { ProjectProps } from "./ProjectCard";
import { CategorySection } from "./projects/CategorySection";
import { FeaturedProject } from "./projects/FeaturedProject";
import { projects } from "./projects/projectData";

export const ProjectGrid = () => {
  // Find the featured project
  const featuredProject = projects.find(p => p.isFeatured);
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <FeaturedProject project={featuredProject} />
      
      <h1 className="text-3xl font-bold text-center text-cyberblue-500 mb-8">Lovable Prosjekter</h1>
      
      <CategorySection title="Kommunikasjon" category="chat" projects={projects} />
      <CategorySection title="Forretningsverktøy" category="business" projects={projects} />
      <CategorySection title="Analyse & Innsikt" category="analytics" projects={projects} />
      <CategorySection title="Infrastruktur" category="infrastructure" projects={projects} />
      
      <div className="mt-10 text-center">
        <a 
          href="/chat"
          className="inline-block bg-cyberblue-500 hover:bg-cyberblue-600 text-cyberdark-950 px-6 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Lokal chat versjon
        </a>
      </div>
    </div>
  );
};
