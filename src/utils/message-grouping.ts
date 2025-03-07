
import { DecryptedMessage } from "@/types/message";

export const groupMessages = (messages: DecryptedMessage[]) => {
  const groups: DecryptedMessage[][] = [];
  let currentGroup: DecryptedMessage[] = [];

  messages.forEach((message, index) => {
    if (index === 0 || currentGroup.length === 0) {
      currentGroup.push(message);
    } else {
      const prevMessage = currentGroup[currentGroup.length - 1];
      const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
      const sameUser = message.sender.id === prevMessage.sender.id;
      
      // Group messages if they are from same user and not more than 5 minutes apart
      if (sameUser && timeDiff < 5 * 60 * 1000) {
        currentGroup.push(message);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [message];
      }
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};
