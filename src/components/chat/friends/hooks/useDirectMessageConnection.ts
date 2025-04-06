
import { WebRTCManager } from "@/utils/webrtc";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!webRTCManager || !friendId) return;

    updateConnectionStatus();
    
    statusCheckInterval.current = setInterval(() => {
      updateConnectionStatus();
    }, 2000);

    connectionTimeout.current = setTimeout(() => {
      const connState = webRTCManager.getConnectionState(friendId);
      const dataState = webRTCManager.getDataChannelState(friendId);
      
      if (connState !== 'connected' || dataState !== 'open') {
        console.log('Falling back to server for message delivery');
        setUsingServerFallback(true);
        toast({
          title: "Direkte tilkobling mislyktes",
          description: "Meldinger sendes via server med ende-til-ende-kryptering.",
          variant: "default",
        });
      }
    }, 10000);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
    };
  }, [webRTCManager, friendId, setUsingServerFallback, toast]);

  const updateConnectionStatus = () => {
    if (!webRTCManager || !friendId) return;
    
    const connState = webRTCManager.getConnectionState(friendId);
    const dataState = webRTCManager.getDataChannelState(friendId);
    
    setConnectionState(connState);
    setDataChannelState(dataState);
    
    if (connState === 'connected' && dataState === 'open') {
      setUsingServerFallback(false);
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
        connectionTimeout.current = null;
      }
    }
  };

  const handleReconnect = async () => {
    if (!webRTCManager || !friendId) return;
    
    // Fix the type error - set a number directly instead of using a function
    setConnectionAttempts(connectionAttempts + 1);
    setUsingServerFallback(false);
    
    toast({
      title: "Kobler til...",
      description: "Forsøker å etablere direkte tilkobling.",
    });
    
    try {
      await webRTCManager.attemptReconnect(friendId);
      
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
      
      connectionTimeout.current = setTimeout(() => {
        const connState = webRTCManager.getConnectionState(friendId);
        const dataState = webRTCManager.getDataChannelState(friendId);
        
        if (connState !== 'connected' || dataState !== 'open') {
          setUsingServerFallback(true);
          toast({
            title: "Direkte tilkobling mislyktes",
            description: "Meldinger sendes via server med ende-til-ende-kryptering.",
          });
        }
      }, 5000);
    } catch (error) {
      console.error('Error reconnecting:', error);
      setUsingServerFallback(true);
    }
  };

  return {
    connectionStatus: connectionState,
    handleReconnect,
    connectionAttempts
  };
};
