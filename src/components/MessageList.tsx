
import { DecryptedMessage } from "@/types/message";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: DecryptedMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-start gap-x-2">
              <div className="flex-1">
                <p className="font-medium text-theme-900">
                  {message.sender.full_name || message.sender.username || 'Anonym'}
                </p>
                <p className="text-gray-600">{message.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
