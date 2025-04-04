
import { useRef, useEffect, useCallback } from "react";
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
  const reconnectionInProgress = useRef<boolean>(false);

  const { updateConnectionStatus, attemptReconnect } = useConnectionState(webRTCManager, friendId, toast);

  // Update connection status more frequently
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
    }, 500); // Even more frequent checks - reduced to 500ms

    // Faster fallback to server
    connectionTimeout.current = setupConnectionTimeout(
      webRTCManager, 
      friendId, 
      setUsingServerFallback, 
      toast,
      2000 // Reduced timeout further to 2000ms for faster fallback
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

  // Improved reconnection handler with debouncing
  const handleReconnect = useCallback(async () => {
    if (!webRTCManager || !friendId || reconnectionInProgress.current) return;
    
    try {
      reconnectionInProgress.current = true;
      
      // Increment connection attempts
      setConnectionAttempts(prevAttempts => prevAttempts + 1);
      
      // Toast to inform user
      toast({
        title: "Kobler til på nytt...",
        description: "Etablerer sikker tilkobling",
      });
      
      const success = await attemptReconnect(usingServerFallback, setUsingServerFallback);
      
      if (success && connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
        connectionTimeout.current = setupConnectionTimeout(
          webRTCManager, 
          friendId, 
          setUsingServerFallback, 
          toast, 
          2000 // Faster timeout for quicker fallback decision
        );
      } else if (!success && !usingServerFallback) {
        // If reconnect fails and not already using server, switch to server fallback
        setUsingServerFallback(true);
        toast({
          title: "Server modus",
          description: "Bruker nå kryptert servermodus for meldinger",
        });
      }
    } finally {
      // Reset reconnection flag after a delay
      setTimeout(() => {
        reconnectionInProgress.current = false;
      }, 3000);
    }
  }, [webRTCManager, friendId, toast, setConnectionAttempts, attemptReconnect, usingServerFallback, setUsingServerFallback]);

  return {
    handleReconnect
  };
};
