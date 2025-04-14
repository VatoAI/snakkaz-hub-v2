
import { SecurityEvent, SecurityMonitorStatus, SecurityStatus, SecurityEventSeverity } from "@/types/security";

export class SecureConnectionMonitor {
  private status: SecurityMonitorStatus = {
    status: 'unknown',
    lastUpdated: new Date(),
  };
  private listeners: Array<(status: SecurityMonitorStatus) => void> = [];
  private static instance: SecureConnectionMonitor;

  private constructor() {}

  public static getInstance(): SecureConnectionMonitor {
    if (!SecureConnectionMonitor.instance) {
      SecureConnectionMonitor.instance = new SecureConnectionMonitor();
    }
    return SecureConnectionMonitor.instance;
  }

  public getStatus(): SecurityMonitorStatus {
    return { ...this.status };
  }

  public resetStatus(): void {
    this.updateStatus('unknown');
  }

  public updateStatus(status: SecurityStatus, details?: string): void {
    this.status = {
      status,
      lastUpdated: new Date(),
      details,
    };
    this.notifyListeners();
  }

  public recordEvent(type: SecurityEventSeverity, message: string): void {
    const event: SecurityEvent = {
      type,
      message,
      timestamp: new Date(),
    };
    
    console.log('Security event:', event);
    
    // Update status based on event type
    switch (type) {
      case 'error':
        this.updateStatus('error', message);
        break;
      case 'security_check_started':
        this.updateStatus('verifying', 'Security check in progress');
        break;
      case 'security_check_completed':
        this.updateStatus('secure', 'Security check completed');
        break;
      default:
        // Other events don't affect status
        break;
    }
  }

  public addStatusChangeListener(listener: (status: SecurityMonitorStatus) => void): void {
    this.listeners.push(listener);
  }

  public removeStatusChangeListener(listener: (status: SecurityMonitorStatus) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.status);
    }
  }
}

// Export a singleton instance
export const securityMonitor = SecureConnectionMonitor.getInstance();
