
export type SecurityEventSeverity = 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success'
  | 'login_attempt'
  | 'login_failed'
  | 'login_success'
  | 'login_error'
  | 'security_check_started'
  | 'security_check_completed';

export type SecurityStatus = 
  | 'secure'
  | 'insecure'
  | 'unknown'
  | 'verifying'
  | 'error';

export interface SecurityEvent {
  type: SecurityEventSeverity;
  message: string;
  timestamp: Date;
}

export interface SecurityMonitorStatus {
  status: SecurityStatus;
  lastUpdated: Date;
  details?: string;
}
