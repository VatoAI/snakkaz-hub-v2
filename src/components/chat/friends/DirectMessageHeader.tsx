
import { Friend } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Wifi, WifiOff, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DirectMessageHeaderProps {
  friend: Friend;
  username: string;
  avatarUrl?: string | null;
  connectionState: string;
  dataChannelState: string;
  usingServerFallback: boolean;
  connectionAttempts: number;
  onBack: () => void;
  onReconnect: () => void;
  isTyping?: boolean;
}

export const DirectMessageHeader = ({
  friend,
  username,
  avatarUrl,
  connectionState,
  dataChannelState,
  usingServerFallback,
  connectionAttempts,
  onBack,
  onReconnect,
  isTyping
}: DirectMessageHeaderProps) => {
  const isConnected = connectionState === 'connected' && dataChannelState === 'open';
  
  return (
    <div className="flex items-center justify-between p-3 bg-cyberdark-900 border-b border-cybergold-500/30">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-cybergold-500 hover:text-cybergold-400 hover:bg-cyberdark-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-cybergold-500/20">
            {avatarUrl ? (
              <AvatarImage 
                src={supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl} 
                alt={username} 
              />
            ) : (
              <AvatarFallback className="bg-cybergold-900 text-cybergold-500">
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div>
            <h3 className="font-medium text-cybergold-100">{username}</h3>
            <div className="flex items-center gap-1">
              {isTyping ? (
                <span className="text-xs text-cybergold-400 flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Skriver...
                </span>
              ) : (
                <span className="text-xs text-cybergold-500">
                  {usingServerFallback ? 'Server mode' : isConnected ? 'P2P connected' : `Connecting... (${connectionState})`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : usingServerFallback ? (
          <WifiOff className="h-4 w-4 text-yellow-500" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReconnect}
            disabled={connectionAttempts > 5}
            className="text-xs text-cybergold-400 hover:text-cybergold-300 p-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};
