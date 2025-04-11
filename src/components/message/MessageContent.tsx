import React from 'react';
import { DecryptedMessage } from "@/types/message";
import { MessageMedia } from "./MessageMedia";
import { MessageTimer } from "./MessageTimer";

interface MessageContentProps {
  message: DecryptedMessage;
  onMessageExpired: (messageId: string) => void;
}

export const MessageContent = ({ message, onMessageExpired }: MessageContentProps) => {
  if (message.is_deleted) {
    return (
      <p className="text-cyberdark-400 italic text-xs sm:text-sm">
        Denne meldingen ble slettet
      </p>
    );
  }

  return (
    <>
      <div className="message-text">
        {message.content}
        {message.is_edited && (
          <span className="text-[10px] text-cyberdark-400 ml-1">(redigert)</span>
        )}
      </div>
      <MessageMedia message={message} />
      <div className="flex items-center gap-2 mt-1">
        <p className="text-[10px] sm:text-xs text-cyberdark-400 group-hover:text-cyberdark-300">
          {new Date(message.created_at).toLocaleString()}
        </p>
        <MessageTimer 
          message={message} 
          onExpired={() => onMessageExpired(message.id)} 
        />
      </div>
    </>
  );
};
