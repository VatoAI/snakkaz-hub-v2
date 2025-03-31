
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GithubIcon, ExternalLink } from "lucide-react";

export interface ProjectProps {
  title: string;
  description: string;
  previewUrl: string;
  githubUrl?: string;
  category: 'chat' | 'business' | 'analytics' | 'infrastructure';
}

export const ProjectCard = ({ title, description, previewUrl, githubUrl, category }: ProjectProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chat':
        return 'border-cyberblue-500';
      case 'business':
        return 'border-cybergold-500';
      case 'analytics':
        return 'border-green-500';
      case 'infrastructure':
        return 'border-purple-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <Card className={`h-full bg-cyberdark-900 border-2 ${getCategoryColor(category)} hover:shadow-neon-gold transition-all duration-300`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-cybergold-400 text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 text-sm">
        <p>{description}</p>
      </CardContent>
      <CardFooter className="flex justify-between mt-auto pt-4">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-cyberblue-400 hover:text-cyberblue-300 text-sm transition-colors"
        >
          <ExternalLink size={16} className="mr-1" />
          Preview
        </a>
        
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-cybergold-400 hover:text-cybergold-300 text-sm transition-colors"
          >
            <GithubIcon size={16} className="mr-1" />
            GitHub
          </a>
        )}
      </CardFooter>
    </Card>
  );
};
