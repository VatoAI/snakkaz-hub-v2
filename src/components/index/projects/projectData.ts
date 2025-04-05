import { ProjectProps } from "../ProjectCard";

// Project data
export const projects: (ProjectProps & { isFeatured?: boolean })[] = [
  // AI Dash Hub as featured project
  {
    title: "AI Dash Hub",
    description: "AI-powered analytics dashboard with predictive capabilities - The main hub for SnakkaZ.com",
    previewUrl: "https://preview--ai-dash-hub.lovable.app/",
    githubUrl: "https://github.com/VatoAI/ai-dash-hub.git",
    category: "analytics",
    hasSupabase: true,
    isFeatured: true
  },
  
  // SnakkaZ Guardian Chat - no longer featured
  {
    title: "SnakkaZ Guardian Chat",
    description: "Secure chat application with advanced encryption and privacy features",
    previewUrl: "https://preview--snakkaz-guardian-chat.lovable.app/",
    githubUrl: "https://github.com/VatoAI/snakkaz-guardian-chat.git",
    category: "chat",
    hasSupabase: true
  },
  
  // Other Chat Projects
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
