
import React from 'react';
import { DecryptedMessage } from '@/types/message';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

export interface MessageTimerProps {
  message?: DecryptedMessage;
  onExpired?: () => void;
  ttl?: number | null;
  setTtl?: (ttl: number | null) => void;
}

export const MessageTimer: React.FC<MessageTimerProps> = ({ message, onExpired, ttl, setTtl }) => {
  // If we have the ttl and setTtl props, we're using the component as a selector
  if (ttl !== undefined && setTtl) {
    return (
      <Select
        value={ttl ? ttl.toString() : "none"}
        onValueChange={(value) => {
          const ttlValue = value === "none" ? null : parseInt(value, 10);
          setTtl(ttlValue);
        }}
      >
        <SelectTrigger className="w-auto h-6 border-none bg-transparent text-blue-400 hover:text-blue-300">
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{ttl ? `${formatTimeLeft(ttl)}` : 'No TTL'}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No auto-delete</SelectItem>
          <SelectItem value="60">1 minute</SelectItem>
          <SelectItem value="300">5 minutes</SelectItem>
          <SelectItem value="3600">1 hour</SelectItem>
          <SelectItem value="86400">24 hours</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // If we have message prop, we're using the component to display a countdown
  if (!message || !message.ephemeral_ttl) {
    return null;
  }

  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!message.ephemeral_ttl) return;

    const createdAt = new Date(message.created_at).getTime();
    const expiresAt = createdAt + (message.ephemeral_ttl * 1000);
    
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      if (remaining <= 0 && onExpired) {
        onExpired();
        return 0;
      }
      
      return remaining;
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [message.created_at, message.ephemeral_ttl, onExpired]);

  if (timeLeft === null) {
    return null;
  }

  return (
    <span className="text-[10px] sm:text-xs text-pink-400">
      ⏱️ {formatTimeLeft(timeLeft)}
    </span>
  );
};

// Helper function to format time remaining
const formatTimeLeft = (seconds: number) => {
  if (seconds <= 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};
