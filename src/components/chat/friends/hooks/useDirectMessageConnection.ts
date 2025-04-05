
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

export const useDirectMessageConnection = (userId: string | undefined, friendId: string | undefined) => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 5;
  const connectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const disconnect = useCallback(() => {
    console.log('Disconnecting from direct message channel');
    
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
      connectionTimeout.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    if (!userId || !friendId || connectionStatus === 'connecting') {
      console.log('Connection attempt aborted: missing user ID or friend ID, or already connecting', { 
        userId, friendId, connectionStatus 
      });
      return;
    }

    // Check if we've exceeded the max connection attempts
    if (connectionAttempts >= maxConnectionAttempts) {
      console.error(`Max connection attempts reached (${maxConnectionAttempts}). Giving up.`);
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    console.log(`Connection attempt ${connectionAttempts + 1} of ${maxConnectionAttempts}`);

    // Set up timeout to detect connection failure
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current);
    }

    connectionTimeout.current = setTimeout(() => {
      console.error('Connection timed out');
      
      // Clean up the current channel attempt
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      // Increment connection attempts and try again
      setConnectionAttempts((prevAttempts) => prevAttempts + 1);
      setConnectionStatus('disconnected');
      
      // Try to reconnect after delay (exponential backoff)
      const reconnectDelay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000); // Capped at 30 seconds
      console.log(`Will attempt to reconnect in ${reconnectDelay}ms`);
      
      setTimeout(connect, reconnectDelay);
    }, 10000); // 10 second timeout

    // Create a channel for presence
    const channel = supabase.channel(`direct_messages:${userId}:${friendId}`, {
      config: {
        broadcast: {
          self: false,
        },
        presence: {
          key: userId,
        },
      },
    });

    // Listen for connection status changes
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced');
        
        // Clear connection timeout
        if (connectionTimeout.current) {
          clearTimeout(connectionTimeout.current);
          connectionTimeout.current = null;
        }
        
        setConnectionStatus('connected');
        setConnectionAttempts(0); // Reset connection attempts on successful connection
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined', { key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left', { key, leftPresences });
      })
      .on('system', { event: 'disconnect' }, () => {
        console.error('Disconnected from system');
        setConnectionStatus('disconnected');
      })
      .on('system', { event: 'error' }, (err) => {
        console.error('Connection error:', err);
        setConnectionStatus('disconnected');
      })
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to channel!');
          setConnectionStatus('connected');
          
          // Clear connection timeout
          if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
          }
          
          // Reset connection attempts on successful connection
          setConnectionAttempts(0);
        }
        
        if (
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
          status === REALTIME_SUBSCRIBE_STATES.CLOSED ||
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR
        ) {
          console.error('Subscription failed:', status);
          
          // Clean up the current channel
          if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
          }
          
          // Increment connection attempts
          setConnectionAttempts((prevAttempts) => prevAttempts + 1);
          setConnectionStatus('disconnected');
          
          // Try to reconnect after delay if we haven't exceeded max attempts
          if (connectionAttempts < maxConnectionAttempts) {
            const reconnectDelay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000); // Capped at 30 seconds
            console.log(`Will attempt to reconnect in ${reconnectDelay}ms`);
            
            setTimeout(connect, reconnectDelay);
          } else {
            console.error(`Max connection attempts reached (${maxConnectionAttempts}). Giving up.`);
          }
        }
      });

    // Store the channel reference
    channelRef.current = channel;
  }, [userId, friendId, connectionStatus, connectionAttempts, maxConnectionAttempts]);

  // Auto-connect when user and friend IDs are available
  useEffect(() => {
    if (userId && friendId && connectionStatus === 'disconnected') {
      connect();
    }
    
    // Cleanup on unmount or when IDs change
    return () => {
      disconnect();
    };
  }, [userId, friendId, connectionStatus, connect, disconnect]);

  return {
    connectionStatus,
    connect,
    disconnect,
    connectionAttempts,
    maxConnectionAttempts
  };
};
