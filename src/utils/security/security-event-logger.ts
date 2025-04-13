
/**
 * Security Event Logger
 * 
 * Logs security-related events and provides alerting for suspicious activities
 */

export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface SecurityEvent {
  timestamp: Date;
  severity: SecurityEventSeverity;
  event: string;
  details: Record<string, any>;
  userId?: string;
  peerId?: string;
  ipAddress?: string;
}

export class SecurityEventLogger {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private alertHandlers: ((event: SecurityEvent) => void)[] = [];
  
  /**
   * Log a security event
   */
  public logEvent(
    severity: SecurityEventSeverity,
    event: string,
    details: Record<string, any> = {},
    userId?: string,
    peerId?: string,
    ipAddress?: string
  ): void {
    const securityEvent: SecurityEvent = {
      timestamp: new Date(),
      severity,
      event,
      details,
      userId,
      peerId,
      ipAddress
    };
    
    // Add to log
    this.events.push(securityEvent);
    
    // Trim log if needed
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
    
    // Trigger alerts for high-severity events
    if (severity === SecurityEventSeverity.ERROR || severity === SecurityEventSeverity.CRITICAL) {
      this.triggerAlerts(securityEvent);
    }
    
    // Log to console based on severity
    switch (severity) {
      case SecurityEventSeverity.INFO:
        console.info(`[SECURITY INFO] ${event}`, details);
        break;
      case SecurityEventSeverity.WARNING:
        console.warn(`[SECURITY WARNING] ${event}`, details);
        break;
      case SecurityEventSeverity.ERROR:
        console.error(`[SECURITY ERROR] ${event}`, details);
        break;
      case SecurityEventSeverity.CRITICAL:
        console.error(`[SECURITY CRITICAL] ${event}`, details);
        break;
    }
  }
  
  /**
   * Register an alert handler
   */
  public onAlert(handler: (event: SecurityEvent) => void): () => void {
    this.alertHandlers.push(handler);
    
    // Return function to remove handler
    return () => {
      this.alertHandlers = this.alertHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Trigger alerts for a security event
   */
  private triggerAlerts(event: SecurityEvent): void {
    this.alertHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in security alert handler:', error);
      }
    });
  }
  
  /**
   * Get all logged events
   */
  public getEvents(): SecurityEvent[] {
    return [...this.events];
  }
  
  /**
   * Filter events by criteria
   */
  public filterEvents(
    severity?: SecurityEventSeverity,
    userId?: string,
    peerId?: string,
    startTime?: Date,
    endTime?: Date
  ): SecurityEvent[] {
    return this.events.filter(event => {
      if (severity && event.severity !== severity) return false;
      if (userId && event.userId !== userId) return false;
      if (peerId && event.peerId !== peerId) return false;
      if (startTime && event.timestamp < startTime) return false;
      if (endTime && event.timestamp > endTime) return false;
      return true;
    });
  }
  
  /**
   * Clear all events
   */
  public clearEvents(): void {
    this.events = [];
  }
  
  /**
   * Check if there are critical security issues
   */
  public hasCriticalIssues(): boolean {
    return this.events.some(event => event.severity === SecurityEventSeverity.CRITICAL);
  }
}

// Create singleton instance
const securityEventLoggerInstance = new SecurityEventLogger();
export default securityEventLoggerInstance;
