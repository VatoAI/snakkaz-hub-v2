
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock, Shield, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EditingMessage } from "@/components/message-input/EditingMessage";

interface DirectMessageFormProps {
  usingServerFallback: boolean;
  sendError: string | null;
  isLoading: boolean;
  onSendMessage: (e: React.FormEvent) => Promise<void>;
  newMessage: string;
  onChangeMessage: (message: string) => void;
  connectionState: string;
  dataChannelState: string;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
}

export const DirectMessageForm = ({
  usingServerFallback,
  sendError,
  isLoading,
  onSendMessage,
  newMessage,
  onChangeMessage,
  connectionState,
  dataChannelState,
  editingMessage,
  onCancelEdit
}: DirectMessageFormProps) => {
  const isSecureConnection = (connectionState === 'connected' && dataChannelState === 'open') || usingServerFallback;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isSecureConnection) return;
    
    await onSendMessage(e);
  };

  return (
    <div className="p-3 border-t border-cybergold-500/30 bg-cyberdark-900">
      {/* Timer notification - moved to a separate component and made smaller */}
      <Alert className="mb-2 py-1 px-2 bg-cyberdark-800/50 border-cybergold-400/30">
        <AlertDescription className="text-xs text-cybergold-300 flex items-center">
          <Clock className="h-3 w-3 mr-1" /> 
          Alle meldinger slettes automatisk etter 24 timer
        </AlertDescription>
      </Alert>
      
      {/* Show editing message component if we're editing */}
      {editingMessage && onCancelEdit && (
        <EditingMessage
          editingMessage={editingMessage}
          onCancelEdit={onCancelEdit}
        />
      )}
      
      {usingServerFallback && (
        <Alert className="mb-2 bg-amber-900/20 border-amber-700 text-amber-300 py-2">
          <AlertDescription className="text-xs flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            Direkte tilkobling mislyktes. Meldinger sendes via server med ende-til-ende-kryptering.
          </AlertDescription>
        </Alert>
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
          placeholder={isSecureConnection 
            ? "Skriv en kryptert melding..." 
            : "Venter på sikker tilkobling..."}
          className={`flex-1 bg-cyberdark-800 border-cybergold-500/30 text-cyberblue-100 ${!isSecureConnection ? 'opacity-50' : ''}`}
          disabled={isLoading || !isSecureConnection}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !newMessage.trim() || !isSecureConnection}
                  className="bg-cybergold-500 hover:bg-cybergold-600 text-black"
                >
                  {isLoading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {isSecureConnection && <Shield className="h-3 w-3" />}
                      <Send className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="bg-cyberdark-800 border-cybergold-500/30">
              <p className="text-xs">
                {isSecureConnection 
                  ? "Sikker ende-til-ende-kryptert melding" 
                  : "Venter på sikker tilkobling"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
    </div>
  );
};
