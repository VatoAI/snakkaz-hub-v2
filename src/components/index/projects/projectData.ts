
import { ProjectProps } from "../ProjectCard";

export const projects: (ProjectProps & { isFeatured?: boolean })[] = [
  {
    title: "ChatCipher Assistant",
    description: "Sikker samtalekryptering med avansert AI-assistent. Chat med ende-til-ende-kryptering og intelligente svar.",
    previewUrl: "https://chatcipher-assistant.lovable.app",
    category: "chat",
    isFeatured: true,
    hasSupabase: true,
    progress: 98
  },
  {
    title: "AI Dash Hub",
    description: "Interaktivt dashboard for AI-basert datavisualisering og analyse. Integrer flere datakilder og få innsikt i sanntid.",
    previewUrl: "https://ai-dash-hub.lovable.app",
    githubUrl: "https://github.com/snakkaz/ai-dash-hub",
    category: "analytics",
    hasSupabase: true,
    progress: 92
  },
  {
    title: "SnakkaZ Guardian Chat",
    description: "En sikker chat-plattform med ende-til-ende-kryptering. Del meldinger, bilder og filer med full sikkerhet.",
    previewUrl: "/chat", // Changed to local path instead of external URL
    category: "chat",
    hasSupabase: true,
    progress: 95
  },
  {
    title: "SnakkaZ Business Analyser",
    description: "Visualiser forretningsdata med kraftige analytiske verktøy og dashboards. Tilgjengelig for team på tvers av organisasjoner.",
    previewUrl: "/chat", // Changed to local path that works
    githubUrl: "https://github.com/snakkaz/business-analyzer",
    category: "business",
    progress: 78
  },
  {
    title: "SnakkaZ Secure Docs",
    description: "Dokumentsamarbeid med kryptering og avanserte delingsmuligheter. Perfekt for sensitive forretningsdokumenter.",
    previewUrl: "/chat", // Changed to local path that works
    category: "business",
    hasSupabase: true,
    progress: 65
  },
  {
    title: "SnakkaZ Analytics Hub",
    description: "Samle alle dine datakilder på ett sted for helhetlig analyse og innsikt. Støtter integrering med mange tredjepartstjenester.",
    previewUrl: "/chat", // Changed to local path that works
    githubUrl: "https://github.com/snakkaz/analytics-hub",
    category: "analytics",
    progress: 82
  }
];
