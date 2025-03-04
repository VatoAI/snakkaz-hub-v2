
import { WebRTCManager } from "@/utils/webrtc";
import { useToast } from "@/components/ui/use-toast";

export const useConnectionState = (
  webRTCManager: WebRTCManager | null, 
  friendId: string | undefined,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  const updateConnectionStatus = () => {
    if (!webRTCManager || !friendId) return { connState: 'disconnected', dataState: 'closed' };
    
    const connState = webRTCManager.getConnectionState(friendId);
    const dataState = webRTCManager.getDataChannelState(friendId);
    
    return { connState, dataState };
  };

  const attemptReconnect = async (usingServerFallback: boolean, setUsingServerFallback: (value: boolean) => void) => {
    if (!webRTCManager || !friendId) return;
    
    setUsingServerFallback(false);
    
    toast({
      title: "Kobler til...",
      description: "Forsøker å etablere direkte tilkobling.",
    });
    
    try {
      await webRTCManager.attemptReconnect(friendId);
      return true;
    } catch (error) {
      console.error('Error reconnecting:', error);
      setUsingServerFallback(true);
      return false;
    }
  };

  return {
    updateConnectionStatus,
    attemptReconnect
  };
};

export const setupConnectionTimeout = (
  webRTCManager: WebRTCManager | null,
  friendId: string | undefined,
  setUsingServerFallback: (value: boolean) => void,
  toast: ReturnType<typeof useToast>["toast"],
  timeoutMs: number = 10000
) => {
  if (!webRTCManager || !friendId) return null;
  
  return setTimeout(() => {
    const connState = webRTCManager.getConnectionState(friendId);
    const dataState = webRTCManager.getDataChannelState(friendId);
    
    if (connState !== 'connected' || dataState !== 'open') {
      setUsingServerFallback(true);
      toast({
        title: "Direkte tilkobling mislyktes",
        description: "Meldinger sendes via server med ende-til-ende-kryptering.",
        variant: "default",
      });
    }
  }, timeoutMs);
};
