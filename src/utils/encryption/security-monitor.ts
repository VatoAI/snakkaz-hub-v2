
import { SecurityEvent, SecurityMonitorStatus, SecurityStatus, SecurityEventSeverity } from "@/types/security";

export class SecureConnectionMonitor {
  private status: SecurityMonitorStatus = {
    status: 'unknown',
    lastUpdated: new Date(),
  };
  
  private events: SecurityEvent[] = [];
  private listeners: Array<(event: SecurityEvent) => void> = [];
  private statusListeners: Array<(status: SecurityMonitorStatus) => void> = [];
  
  constructor() {
    console.log('Secure connection monitor initialized');
    this.logEvent('info', 'Security monitor initialized');
    this.verifyConnection();
  }
  
  private async verifyConnection(): Promise<void> {
    this.setStatus('verifying');
    this.logEvent('security_check_started', 'Starting security check');
    
    try {
      // Simulate security checks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, we would check for:
      // - HTTPS connection
      // - Valid certificates
      // - Secure cookies
      // - Content Security Policy
      // - etc.
      
      this.setStatus('secure');
      this.logEvent('security_check_completed', 'Security check passed');
    } catch (error) {
      this.setStatus('error');
      this.logEvent('error', `Security check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  public getStatus(): SecurityMonitorStatus {
    return { ...this.status };
  }
  
  private setStatus(status: SecurityStatus, details?: string): void {
    this.status = {
      status,
      lastUpdated: new Date(),
      details,
    };
    
    this.notifyStatusListeners();
  }
  
  public logEvent(type: SecurityEventSeverity, message: string): void {
    const event: SecurityEvent = {
      type,
      message,
      timestamp: new Date(),
    };
    
    this.events.push(event);
    this.notifyEventListeners(event);
    
    console.log(`[Security ${type}] ${message}`);
  }
  
  public getEvents(): SecurityEvent[] {
    return [...this.events];
  }
  
  public onEvent(callback: (event: SecurityEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  public onStatusChange(callback: (status: SecurityMonitorStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
    };
  }
  
  private notifyEventListeners(event: SecurityEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in security event listener:', error);
      }
    });
  }
  
  private notifyStatusListeners(): void {
    this.statusListeners.forEach(listener => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Error in security status listener:', error);
      }
    });
  }
}

// Create a singleton instance of the security monitor
export const securityMonitor = new SecureConnectionMonitor();
