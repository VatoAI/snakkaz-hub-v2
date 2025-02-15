
import { DecryptedMessage } from "@/types/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";

interface MessageListProps {
  messages: DecryptedMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <ScrollArea className="h-full px-4 py-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            <div className="group flex items-start gap-x-3 hover:bg-cyberdark-800/50 p-3 rounded-lg transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-cyberdark-700 border border-cybergold-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-cybergold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cybergold-300 mb-1 group-hover:text-cybergold-200 transition-colors">
                  {message.sender.full_name || message.sender.username || 'Anonym'}
                </p>
                <p className="text-cyberblue-100 text-sm break-words">
                  {message.content}
                </p>
                <p className="text-xs text-cyberdark-600 mt-1 group-hover:text-cyberdark-500">
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
