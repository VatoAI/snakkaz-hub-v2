
import React, { useEffect, useState } from 'react';
import { DecryptedMessage } from '@/types/message';

export interface MessageTimerProps {
  message: DecryptedMessage;
  onExpired: () => void;
}

export const MessageTimer: React.FC<MessageTimerProps> = ({ message, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
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

  if (!message.ephemeral_ttl || timeLeft === null) {
    return null;
  }

  const formatTimeLeft = () => {
    if (timeLeft <= 60) {
      return `${timeLeft}s`;
    }
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <span className="text-[10px] sm:text-xs text-pink-400">
      ⏱️ {formatTimeLeft()}
    </span>
  );
};
