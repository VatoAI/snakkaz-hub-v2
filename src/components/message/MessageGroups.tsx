
import { DecryptedMessage } from "@/types/message";
import { MessageGroup } from "./MessageGroup";
import { useRef } from "react";

interface MessageGroupsProps {
  messageGroups: DecryptedMessage[][];
  isUserMessage: (message: DecryptedMessage) => boolean;
  onMessageExpired: (messageId: string) => void;
  onEdit: (message: DecryptedMessage) => void;
  onDelete: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageGroups = ({ 
  messageGroups, 
  isUserMessage, 
  onMessageExpired, 
  onEdit, 
  onDelete, 
  messagesEndRef 
}: MessageGroupsProps) => {
  return (
    <div className="space-y-2 sm:space-y-4">
      {messageGroups.map((group, groupIndex) => (
        <MessageGroup
          key={`group-${groupIndex}-${group[0].id}`}
          messages={group}
          isCurrentUser={isUserMessage(group[0])}
          onMessageExpired={onMessageExpired}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
