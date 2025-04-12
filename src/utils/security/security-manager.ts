import { ConnectionQuality } from '../webrtc/connection-quality-monitor';

export enum AccessLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  ADMIN = 3
}

export interface AccessControl {
  userId: string;
  resourceId: string;
  accessLevel: AccessLevel;
  expiresAt?: Date;
}

export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface RetentionPolicy {
  resourceType: string;
  maxAgeDays: number;
  maxSizeBytes?: number;
  archiveAfterDays?: number;
}

export class SecurityManager {
  private accessControls: Map<string, AccessControl[]> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private static readonly MAX_AUDIT_LOG_SIZE = 100000; // Maximum number of audit log entries to keep

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies() {
    // Default retention policies
    this.addRetentionPolicy({
      resourceType: 'chat_messages',
      maxAgeDays: 30,
      maxSizeBytes: 100 * 1024 * 1024, // 100MB
      archiveAfterDays: 7
    });

    this.addRetentionPolicy({
      resourceType: 'media_files',
      maxAgeDays: 90,
      maxSizeBytes: 1024 * 1024 * 1024, // 1GB
      archiveAfterDays: 30
    });

    this.addRetentionPolicy({
      resourceType: 'user_data',
      maxAgeDays: 365,
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      archiveAfterDays: 90
    });
  }

  // Access Control Methods
  public grantAccess(accessControl: AccessControl) {
    const userAccess = this.accessControls.get(accessControl.userId) || [];
    userAccess.push(accessControl);
    this.accessControls.set(accessControl.userId, userAccess);
    this.logAudit('GRANT_ACCESS', accessControl.userId, accessControl.resourceId, accessControl);
  }

  public revokeAccess(userId: string, resourceId: string) {
    const userAccess = this.accessControls.get(userId);
    if (userAccess) {
      const filteredAccess = userAccess.filter(ac => ac.resourceId !== resourceId);
      this.accessControls.set(userId, filteredAccess);
      this.logAudit('REVOKE_ACCESS', userId, resourceId);
    }
  }

  public checkAccess(userId: string, resourceId: string, requiredLevel: AccessLevel): boolean {
    const userAccess = this.accessControls.get(userId);
    if (!userAccess) return false;

    const access = userAccess.find(ac => ac.resourceId === resourceId);
    if (!access) return false;

    if (access.expiresAt && access.expiresAt < new Date()) {
      this.revokeAccess(userId, resourceId);
      return false;
    }

    return access.accessLevel >= requiredLevel;
  }

  // Audit Logging Methods
  public logAudit(
    action: string,
    userId: string,
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      userId,
      action,
      resourceId,
      details,
      ipAddress,
      userAgent
    };

    this.auditLogs.push(entry);
    this.cleanupAuditLogs();
  }

  private cleanupAuditLogs() {
    if (this.auditLogs.length > SecurityManager.MAX_AUDIT_LOG_SIZE) {
      // Remove oldest entries to maintain size limit
      this.auditLogs = this.auditLogs.slice(-SecurityManager.MAX_AUDIT_LOG_SIZE);
    }
  }

  public getAuditLogs(
    userId?: string,
    resourceId?: string,
    startDate?: Date,
    endDate?: Date
  ): AuditLogEntry[] {
    return this.auditLogs.filter(entry => {
      if (userId && entry.userId !== userId) return false;
      if (resourceId && entry.resourceId !== resourceId) return false;
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });
  }

  // Retention Policy Methods
  public addRetentionPolicy(policy: RetentionPolicy) {
    this.retentionPolicies.set(policy.resourceType, policy);
  }

  public getRetentionPolicy(resourceType: string): RetentionPolicy | undefined {
    return this.retentionPolicies.get(resourceType);
  }

  public shouldArchive(resourceType: string, createdAt: Date): boolean {
    const policy = this.getRetentionPolicy(resourceType);
    if (!policy || !policy.archiveAfterDays) return false;

    const archiveDate = new Date(createdAt);
    archiveDate.setDate(archiveDate.getDate() + policy.archiveAfterDays);
    return new Date() >= archiveDate;
  }

  public shouldDelete(resourceType: string, createdAt: Date): boolean {
    const policy = this.getRetentionPolicy(resourceType);
    if (!policy) return false;

    const deleteDate = new Date(createdAt);
    deleteDate.setDate(deleteDate.getDate() + policy.maxAgeDays);
    return new Date() >= deleteDate;
  }

  // Data Cleanup Methods
  public async cleanupExpiredData() {
    const now = new Date();
    
    // Cleanup expired access controls
    for (const [userId, accessControls] of this.accessControls.entries()) {
      const validAccess = accessControls.filter(ac => {
        if (!ac.expiresAt) return true;
        return ac.expiresAt > now;
      });
      
      if (validAccess.length !== accessControls.length) {
        this.accessControls.set(userId, validAccess);
        this.logAudit('CLEANUP_EXPIRED_ACCESS', 'system', 'access_controls', {
          userId,
          removedCount: accessControls.length - validAccess.length
        });
      }
    }

    // Cleanup audit logs based on retention policy
    const auditPolicy = this.getRetentionPolicy('audit_logs');
    if (auditPolicy) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - auditPolicy.maxAgeDays);
      
      const originalLength = this.auditLogs.length;
      this.auditLogs = this.auditLogs.filter(entry => entry.timestamp >= cutoffDate);
      
      if (this.auditLogs.length !== originalLength) {
        this.logAudit('CLEANUP_AUDIT_LOGS', 'system', 'audit_logs', {
          removedCount: originalLength - this.auditLogs.length
        });
      }
    }
  }

  // Security Monitoring Methods
  public detectAnomalies(quality: ConnectionQuality): boolean {
    // Implement anomaly detection based on connection quality metrics
    const thresholds = {
      maxLatency: 500, // ms
      maxPacketLoss: 10, // percentage
      minBandwidth: 100 // kbps
    };

    return (
      quality.latency > thresholds.maxLatency ||
      quality.packetLoss > thresholds.maxPacketLoss ||
      quality.bandwidth < thresholds.minBandwidth
    );
  }

  public getSecurityReport() {
    return {
      accessControls: {
        totalUsers: this.accessControls.size,
        totalGrants: Array.from(this.accessControls.values())
          .reduce((sum, controls) => sum + controls.length, 0)
      },
      auditLogs: {
        totalEntries: this.auditLogs.length,
        recentActions: this.auditLogs.slice(-10)
      },
      retentionPolicies: Array.from(this.retentionPolicies.values())
    };
  }
} 