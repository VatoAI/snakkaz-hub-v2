
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditingMessage } from "@/components/message-input/EditingMessage";

interface DirectMessageFormProps {
  sendError: string | null;
  isLoading: boolean;
  onSendMessage: (e: React.FormEvent) => Promise<void>;
  newMessage: string;
  onChangeMessage: (message: string) => void;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  // Add the missing properties from the error message
  connectionState?: string;
  dataChannelState?: string;
  usingServerFallback?: boolean;
}

export const DirectMessageForm = ({
  sendError,
  isLoading,
  onSendMessage,
  newMessage,
  onChangeMessage,
  editingMessage,
  onCancelEdit,
  // Include the new props in the destructuring
  connectionState,
  dataChannelState,
  usingServerFallback
}: DirectMessageFormProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await onSendMessage(e);
  };

  return (
    <div className="p-3 border-t border-cybergold-500/30 bg-cyberdark-900">
      {/* Show editing message component if we're editing */}
      {editingMessage && onCancelEdit && (
        <EditingMessage
          editingMessage={editingMessage}
          onCancelEdit={onCancelEdit}
        />
      )}
      
      {sendError && (
        <Alert className="mb-2 bg-red-900/20 border-red-700 text-red-300 py-2">
          <AlertDescription className="text-xs">
            {sendError}
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => onChangeMessage(e.target.value)}
          placeholder="Skriv en melding..."
          className="flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !newMessage.trim()}
          className="bg-cybergold-500 hover:bg-cybergold-600 text-black"
        >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};
