
import { ProjectProps } from "../ProjectCard";

export const projects: (ProjectProps & { isFeatured?: boolean })[] = [
  {
    title: "SnakkaZ Guardian Chat",
    description: "En sikker chat-plattform med ende-til-ende-kryptering. Del meldinger, bilder og filer med full sikkerhet.",
    previewUrl: "https://snakkaz-chat.lovable.app",
    category: "chat",
    isFeatured: true,
    hasSupabase: true,
    progress: 95
  },
  {
    title: "SnakkaZ Business Analyser",
    description: "Visualiser forretningsdata med kraftige analytiske verktøy og dashboards. Tilgjengelig for team på tvers av organisasjoner.",
    previewUrl: "https://business-analyzer.lovable.app",
    githubUrl: "https://github.com/snakkaz/business-analyzer",
    category: "business",
    progress: 78
  },
  {
    title: "SnakkaZ Secure Docs",
    description: "Dokumentsamarbeid med kryptering og avanserte delingsmuligheter. Perfekt for sensitive forretningsdokumenter.",
    previewUrl: "https://secure-docs.lovable.app",
    category: "business",
    hasSupabase: true,
    progress: 65
  },
  {
    title: "SnakkaZ Analytics Hub",
    description: "Samle alle dine datakilder på ett sted for helhetlig analyse og innsikt. Støtter integrering med mange tredjepartstjenester.",
    previewUrl: "https://analytics-hub.lovable.app",
    githubUrl: "https://github.com/snakkaz/analytics-hub",
    category: "analytics",
    progress: 82
  },
  {
    title: "SnakkaZ Cloud Gateway",
    description: "Infrastrukturløsning som forener skybaserte tjenester med lokale ressurser. Sikkerhetsoptimalisert design.",
    previewUrl: "https://cloud-gateway.lovable.app",
    category: "infrastructure",
    progress: 60
  },
  {
    title: "SnakkaZ Trend Detector",
    description: "Identifiser trender i store datasett med maskinlæring. Forutsi fremtidige utviklinger basert på historiske data.",
    previewUrl: "https://trend-detector.lovable.app",
    githubUrl: "https://github.com/snakkaz/trend-detector",
    category: "analytics",
    progress: 38
  }
];
