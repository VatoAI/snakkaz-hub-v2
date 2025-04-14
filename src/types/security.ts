
// Define security event types
export type SecurityEventSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'security_check_started'
  | 'security_check_completed'
  | 'login_attempt'
  | 'login_success'
  | 'login_failed'
  | 'login_error';

// Define security status types
export type SecurityStatus = 'secure' | 'verifying' | 'error' | 'unknown';

// Security event interface
export interface SecurityEvent {
  type: SecurityEventSeverity;
  message: string;
  timestamp: Date;
}

// Security monitor status interface
export interface SecurityMonitorStatus {
  status: SecurityStatus;
  lastUpdated: Date;
  details?: string;
}
