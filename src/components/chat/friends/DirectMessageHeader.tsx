
import { Friend } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Wifi, WifiOff, MessageSquare, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // Determine connection security status
  const getSecurityStatus = () => {
    if (isConnected) {
      return {
        icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
        label: 'Sikker tilkobling (E2EE+P2P)',
        color: 'text-green-500',
        secure: true
      };
    } else if (usingServerFallback) {
      return {
        icon: <Lock className="h-4 w-4 text-yellow-500" />,
        label: 'Kryptert via server (E2EE)',
        color: 'text-yellow-500',
        secure: true
      };
    } else {
      return {
        icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
        label: 'Etablerer sikker tilkobling...',
        color: 'text-red-500',
        secure: false
      };
    }
  };

  const securityStatus = getSecurityStatus();
  
  return (
    <div className="flex flex-col bg-cyberdark-900 border-b border-cybergold-500/30">
      <div className="flex items-center justify-between p-3">
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
                  <span className={`text-xs flex items-center gap-1 ${securityStatus.color}`}>
                    {securityStatus.icon}
                    <span>{securityStatus.label}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
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
                      Koble til på nytt
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected ? "Direkte tilkobling (P2P)" : 
                 usingServerFallback ? "Server-modus (E2EE)" : 
                 "Kobler til..."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Security status banner */}
      {!securityStatus.secure && (
        <div className="px-4 py-2 bg-red-900/30 text-red-200 text-xs text-center font-medium">
          Venter på sikker tilkobling. Du kan ikke sende meldinger før tilkoblingen er sikker.
        </div>
      )}
    </div>
  );
};
