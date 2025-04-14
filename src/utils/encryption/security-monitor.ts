
import { SecurityStatus, SecurityMonitorStatus } from '@/types/security';

type StatusChangeListener = (status: SecurityMonitorStatus) => void;

export class SecureConnectionMonitor {
  private status: SecurityStatus = 'unknown';
  private statusDetails?: string;
  private lastUpdated: Date = new Date();
  private statusListeners: StatusChangeListener[] = [];

  constructor() {
    // Initialize with unknown status
    this.updateStatus('unknown');
  }

  public getStatus(): SecurityMonitorStatus {
    return {
      status: this.status,
      lastUpdated: this.lastUpdated,
      details: this.statusDetails
    };
  }

  public updateStatus(status: SecurityStatus, details?: string): void {
    this.status = status;
    this.statusDetails = details;
    this.lastUpdated = new Date();
    
    // Notify all listeners
    this.notifyListeners();
  }

  public resetStatus(): void {
    this.updateStatus('unknown');
  }

  public addStatusChangeListener(listener: StatusChangeListener): void {
    this.statusListeners.push(listener);
  }

  public removeStatusChangeListener(listener: StatusChangeListener): void {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    const currentStatus = this.getStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(currentStatus);
      } catch (error) {
        console.error('Error in status change listener:', error);
      }
    });
  }
}

// Create a singleton instance
export const securityMonitor = new SecureConnectionMonitor();
