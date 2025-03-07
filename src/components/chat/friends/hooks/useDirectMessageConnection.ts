
import { useRef, useEffect } from "react";
import { WebRTCManager } from "@/utils/webrtc";
import { useConnectionState, setupConnectionTimeout } from "../utils/directMessage-connection-utils";
import { useToast } from "@/components/ui/use-toast";

export const useDirectMessageConnection = (
  webRTCManager: WebRTCManager | null,
  friendId: string | undefined,
  connectionState: string, 
  setConnectionState: (state: string) => void,
  dataChannelState: string, 
  setDataChannelState: (state: string) => void,
  usingServerFallback: boolean,
  setUsingServerFallback: (value: boolean) => void,
  connectionAttempts: number,
  setConnectionAttempts: (value: number) => void
) => {
  const { toast } = useToast();
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);

  const { updateConnectionStatus, attemptReconnect } = useConnectionState(webRTCManager, friendId, toast);

  useEffect(() => {
    if (!webRTCManager || !friendId) return;

    // Initial update of connection status
    const { connState, dataState } = updateConnectionStatus();
    setConnectionState(connState);
    setDataChannelState(dataState);
    
    // Set up interval to check connection status - check more frequently
    statusCheckInterval.current = setInterval(() => {
      const { connState, dataState } = updateConnectionStatus();
      setConnectionState(connState);
      setDataChannelState(dataState);
      
      if (connState === 'connected' && dataState === 'open') {
        setUsingServerFallback(false);
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }
      }
    }, 1000); // Reduced from 2000ms to 1000ms for more frequent checks

    // Set up connection timeout - make it shorter
    connectionTimeout.current = setupConnectionTimeout(
      webRTCManager, 
      friendId, 
      setUsingServerFallback, 
      toast,
      3000 // Reduced from default (typically 5000ms) to 3000ms
    );

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
    };
  }, [webRTCManager, friendId, toast, setConnectionState, setDataChannelState, setUsingServerFallback, updateConnectionStatus]);

  const handleReconnect = async () => {
    if (!webRTCManager || !friendId) return;
    
    // Fix the error by directly setting the value instead of using a function
    setConnectionAttempts(connectionAttempts + 1);
    
    const success = await attemptReconnect(usingServerFallback, setUsingServerFallback);
    
    if (success && connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = setupConnectionTimeout(
        webRTCManager, 
        friendId, 
        setUsingServerFallback, 
        toast, 
        3000 // Reduced from 5000ms to 3000ms
      );
    }
  };

  return {
    handleReconnect
  };
};
