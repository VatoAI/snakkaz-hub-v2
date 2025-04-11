import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageTimerProps {
  ttl: number | null;
  setTtl: (ttl: number | null) => void;
}

export const MessageTimer = ({ ttl, setTtl }: MessageTimerProps) => {
  // Fixed TTL of 24 hours (86400 seconds)
  const defaultTtl = 86400;
  
  // Force 24-hour TTL for all messages
  if (ttl !== defaultTtl) {
    setTtl(defaultTtl);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-[10px] text-cyberdark-400">
            <Clock className="h-3 w-3 mr-1" />
            24t
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="text-xs">
          Slettes automatisk etter 24 timer
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
