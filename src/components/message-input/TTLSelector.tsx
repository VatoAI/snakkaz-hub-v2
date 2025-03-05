
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TTLSelectorProps {
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
  isLoading: boolean;
  isRecording: boolean;
}

export const TTLSelector = ({ ttl, setTtl, isLoading, isRecording }: TTLSelectorProps) => {
  // Messages now always have a 24-hour TTL (86400 seconds)
  const defaultTtl = 86400;
  
  // User can no longer change TTL, as all messages expire after 24 hours
  const isDisabled = true;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button 
              type="button"
              variant="outline" 
              size="icon"
              className="bg-cyberdark-800 border-cybergold-500/30 text-cybergold-400 hover:text-cybergold-300 hover:bg-cyberdark-700"
              disabled={isLoading || isRecording || isDisabled}
            >
              <Clock className="w-4 h-4" />
              <span className="sr-only">24-timers melding</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-cyberdark-800 border-cybergold-500/30">
          <p className="text-xs">Alle meldinger slettes automatisk etter 24 timer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
