
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { DecryptedMessage } from "@/types/message";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MessageTimerProps {
  message: DecryptedMessage;
  onExpired: () => void;
}

export const MessageTimer = ({ message, onExpired }: MessageTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (!message.ephemeral_ttl) return;

    const createdAt = new Date(message.created_at).getTime();
    const expiryTime = createdAt + message.ephemeral_ttl * 1000;

    const checkExpiry = () => {
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        onExpired();
        return;
      }

      // Less than 1 minute remaining
      setIsExpiring(remaining < 60000);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      let display = "";
      if (hours > 0) {
        display = `${hours}t ${minutes}m`;
      } else if (minutes > 0) {
        display = `${minutes}m ${seconds}s`;
      } else {
        display = `${seconds}s`;
      }

      setTimeLeft(display);
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);

    return () => clearInterval(interval);
  }, [message.created_at, message.ephemeral_ttl, onExpired]);

  if (!timeLeft) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1 text-[10px] sm:text-xs ${
              isExpiring ? "text-red-400" : "text-cyberdark-400"
            }`}
          >
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-cyberdark-900 border-cybergold-500/20 text-xs">
          <p>Meldingen slettes om {timeLeft}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
