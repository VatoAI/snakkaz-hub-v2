
/**
 * Chat Security Hook
 * 
 * Provides security features for the chat system
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import secureConnectionMonitorInstance from '@/utils/security/secure-connection-monitor';
import securityEventLoggerInstance, { SecurityEventSeverity } from '@/utils/security/security-event-logger';
import secureMessageStoreInstance from '@/utils/security/secure-message-store';
import pfsInstance from '@/utils/encryption/perfect-forward-secrecy';
import { DecryptedMessage } from '@/types/message';

export const useChatSecurity = (userId: string | null) => {
  const [securityLevel, setSecurityLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [securityEvents, setSecurityEvents] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize security features
  useEffect(() => {
    if (!userId || isInitialized) return;
    
    // Set up alert handler
    const removeHandler = securityEventLoggerInstance.onAlert((event) => {
      // Show toast for critical events
      if (event.severity === SecurityEventSeverity.CRITICAL) {
        toast.error(`Sikkerhetsproblem: ${event.event}`, {
          description: 'Det har oppstått et alvorlig sikkerhetsproblem.',
          duration: 10000,
        });
      } else if (event.severity === SecurityEventSeverity.ERROR) {
        toast.warning(`Sikkerhetsadvarsel: ${event.event}`, {
          description: 'Et sikkerhetsproblem har blitt oppdaget.',
          duration: 5000,
        });
      }
      
      setSecurityEvents(prev => prev + 1);
    });
    
    // Log initialization
    securityEventLoggerInstance.logEvent(
      SecurityEventSeverity.INFO,
      'Security system initialized',
      { userId },
      userId
    );
    
    // Schedule periodic key maintenance
    const keyMaintenanceInterval = setInterval(() => {
      pfsInstance.performKeyMaintenance()
        .catch(error => console.error('Error during key maintenance:', error));
    }, 60 * 60 * 1000); // Every hour
    
    // Schedule message purging
    const messagePurgeInterval = setInterval(() => {
      secureMessageStoreInstance.purgeOldMessages()
        .catch(error => console.error('Error purging old messages:', error));
    }, 30 * 60 * 1000); // Every 30 minutes
    
    setIsInitialized(true);
    
    // Cleanup
    return () => {
      removeHandler();
      clearInterval(keyMaintenanceInterval);
      clearInterval(messagePurgeInterval);
    };
  }, [userId, isInitialized]);
  
  // Update connection security for a peer
  const updatePeerConnectionSecurity = useCallback((peerId: string, metrics: {
    latency?: number;
    packetLoss?: number;
    bandwidth?: number;
    connectionTime?: number;
    reconnectAttempts?: number;
  }) => {
    secureConnectionMonitorInstance.updateMetrics(peerId, metrics);
    const level = secureConnectionMonitorInstance.getSecurityLevel(peerId);
    
    if (level !== 'unknown') {
      setSecurityLevel(level);
    }
  }, []);
  
  // Log a security event
  const logSecurityEvent = useCallback((
    severity: SecurityEventSeverity,
    event: string,
    details: Record<string, any> = {},
    peerId?: string
  ) => {
    securityEventLoggerInstance.logEvent(severity, event, details, userId, peerId);
    setSecurityEvents(prev => prev + 1);
  }, [userId]);
  
  // Store messages securely
  const storeMessagesSecurely = useCallback(async (messages: DecryptedMessage[]) => {
    return secureMessageStoreInstance.storeMessages(messages);
  }, []);
  
  // Retrieve stored messages
  const retrieveStoredMessages = useCallback(async () => {
    return secureMessageStoreInstance.retrieveMessages();
  }, []);
  
  // Delete messages securely
  const deleteMessagesSecurely = useCallback(async () => {
    return secureMessageStoreInstance.securelyDeleteMessages();
  }, []);
  
  // Force key rotation for a peer
  const rotateKeyForPeer = useCallback(async (peerId: string) => {
    try {
      const keyId = await pfsInstance.rotateKeys(peerId);
      securityEventLoggerInstance.logEvent(
        SecurityEventSeverity.INFO,
        'Encryption keys rotated',
        { peerId, keyId },
        userId,
        peerId
      );
      return true;
    } catch (error) {
      console.error('Error rotating keys:', error);
      securityEventLoggerInstance.logEvent(
        SecurityEventSeverity.ERROR,
        'Failed to rotate encryption keys',
        { peerId, error: (error as Error).message },
        userId,
        peerId
      );
      return false;
    }
  }, [userId]);
  
  return {
    securityLevel,
    securityEvents,
    updatePeerConnectionSecurity,
    logSecurityEvent,
    storeMessagesSecurely,
    retrieveStoredMessages,
    deleteMessagesSecurely,
    rotateKeyForPeer,
  };
};
