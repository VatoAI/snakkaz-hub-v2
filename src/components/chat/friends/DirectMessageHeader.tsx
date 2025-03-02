
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Friend } from "./types";

interface DirectMessageHeaderProps {
  friend: Friend;
  username: string;
  avatarUrl: string | null;
  connectionState: string;
  dataChannelState: string;
  usingServerFallback: boolean;
  connectionAttempts: number;
  onBack: () => void;
  onReconnect: () => Promise<void>;
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
  onReconnect
}: DirectMessageHeaderProps) => {
  return (
    <div className="flex items-center gap-2 border-b border-cybergold-500/30 p-3 bg-cyberdark-900">
      <Button 
        onClick={onBack}
        size="icon" 
        variant="ghost" 
        className="text-cybergold-300 hover:text-cybergold-200 hover:bg-cyberdark-800"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <Avatar className="h-8 w-8 mr-2">
        {avatarUrl ? (
          <AvatarImage 
            src={supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl}
            alt={username} 
          />
        ) : (
          <AvatarFallback className="bg-cybergold-500/20 text-cybergold-300">
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="flex-1">
        <h2 className="text-cybergold-200 font-medium">{username}</h2>
        <div className="flex items-center text-xs">
          <span 
            className={`w-2 h-2 rounded-full mr-1 ${
              connectionState === 'connected' && dataChannelState === 'open'
                ? 'bg-green-500'
                : connectionState === 'connecting' || dataChannelState === 'connecting'
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          ></span>
          <span className="text-cyberdark-400">
            {connectionState === 'connected' && dataChannelState === 'open'
              ? 'Tilkoblet direkte'
              : usingServerFallback
              ? 'Bruker server'
              : 'Kobler til...'}
          </span>
          
          {(connectionState !== 'connected' || dataChannelState !== 'open') && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 ml-1 text-cybergold-400 hover:text-cybergold-300"
              onClick={onReconnect}
              disabled={connectionAttempts > 3}
              title="Forsøk å koble til igjen"
            >
              <RefreshCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
