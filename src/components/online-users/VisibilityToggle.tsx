
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface VisibilityToggleProps {
  hidden: boolean;
  onToggleHidden: () => void;
}

export const VisibilityToggle = ({ hidden, onToggleHidden }: VisibilityToggleProps) => {
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={onToggleHidden}
      className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:bg-cyberdark-700"
    >
      {hidden ? (
        <><EyeOff className="w-4 h-4 mr-2" /> Skjult</>
      ) : (
        <><Eye className="w-4 h-4 mr-2" /> Synlig</>
      )}
    </Button>
  );
};
