
import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { DecryptedMessage } from "@/types/message";

interface MessageTimerProps {
  message: DecryptedMessage;
  onExpired?: () => void;
}

export const MessageTimer = ({ message, onExpired }: MessageTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!message.ephemeral_ttl) return;

    const calculateTimeLeft = () => {
      const createdAt = new Date(message.created_at).getTime();
      const expiresAt = createdAt + (message.ephemeral_ttl * 1000);
      const now = new Date().getTime();
      const difference = expiresAt - now;
      
      return difference > 0 ? Math.ceil(difference / 1000) : 0;
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [message.created_at, message.ephemeral_ttl, onExpired]);

  if (timeLeft === null || !message.ephemeral_ttl) return null;
  if (timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = minutes > 0 
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  return (
    <div className="flex items-center gap-1 text-xs text-cybergold-300">
      <Timer className="w-3 h-3 text-cyberblue-400" />
      <span className="font-medium">{timeString}</span>
    </div>
  );
};
