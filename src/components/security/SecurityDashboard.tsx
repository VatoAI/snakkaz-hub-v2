import { useState, useEffect } from 'react';
import { SecurityManager } from '../../utils/security/security-manager';
import { supabase } from '../../utils/supabase/client';
import styles from './SecurityDashboard.module.css';

interface SecuritySettings {
  analyticsEnabled: boolean;
  cloudflareAnalyticsEnabled: boolean;
  serviceWorkerEnabled: boolean;
  auditLogEnabled: boolean;
  retentionPolicyEnabled: boolean;
}

export default function SecurityDashboard() {
  const [settings, setSettings] = useState<SecuritySettings>({
    analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    cloudflareAnalyticsEnabled: process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED === 'true',
    serviceWorkerEnabled: process.env.NEXT_PUBLIC_SERVICE_WORKER_ENABLED === 'true',
    auditLogEnabled: process.env.NEXT_PUBLIC_AUDIT_LOG_ENABLED === 'true',
    retentionPolicyEnabled: process.env.NEXT_PUBLIC_RETENTION_POLICY_ENABLED === 'true'
  });

  const [securityReport, setSecurityReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityReport();
  }, []);

  const loadSecurityReport = async () => {
    try {
      const report = await supabase
        .from('security_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (report.data) {
        setSecurityReport(report.data);
      }
    } catch (err) {
      setError('Failed to load security report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof SecuritySettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));

      await supabase
        .from('security_settings')
        .upsert({
          key: `NEXT_PUBLIC_${key.toUpperCase()}`,
          value: value.toString(),
          updated_at: new Date().toISOString()
        });

      if (key === 'serviceWorkerEnabled') {
        if (value) {
          await navigator.serviceWorker.register('/sw.js');
        } else {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
      }
    } catch (err) {
      setError(`Failed to update ${key} setting`);
      console.error(err);
    }
  };

  if (loading) return <div>Loading security dashboard...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.securityDashboard}>
      <h2>Security Dashboard</h2>
      
      <div className={styles.settingsSection}>
        <h3>Security Settings</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={settings.analyticsEnabled}
                onChange={(e) => handleSettingChange('analyticsEnabled', e.target.checked)}
              />
              Enable Analytics
            </label>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={settings.cloudflareAnalyticsEnabled}
                onChange={(e) => handleSettingChange('cloudflareAnalyticsEnabled', e.target.checked)}
              />
              Enable Cloudflare Analytics
            </label>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={settings.serviceWorkerEnabled}
                onChange={(e) => handleSettingChange('serviceWorkerEnabled', e.target.checked)}
              />
              Enable Service Worker
            </label>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={settings.auditLogEnabled}
                onChange={(e) => handleSettingChange('auditLogEnabled', e.target.checked)}
              />
              Enable Audit Logging
            </label>
          </div>
          <div className={styles.settingItem}>
            <label className={styles.label}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={settings.retentionPolicyEnabled}
                onChange={(e) => handleSettingChange('retentionPolicyEnabled', e.target.checked)}
              />
              Enable Retention Policies
            </label>
          </div>
        </div>
      </div>

      {securityReport && (
        <div className={styles.securityReport}>
          <h3>Security Report</h3>
          <div className={styles.reportGrid}>
            <div className={styles.reportItem}>
              <h4>Access Controls</h4>
              <p>Total Users: {securityReport.access_controls?.totalUsers || 0}</p>
              <p>Total Grants: {securityReport.access_controls?.totalGrants || 0}</p>
            </div>
            <div className={styles.reportItem}>
              <h4>Audit Logs</h4>
              <p>Total Entries: {securityReport.audit_logs?.totalEntries || 0}</p>
              <p>Recent Actions: {securityReport.audit_logs?.recentActions?.length || 0}</p>
            </div>
            <div className={styles.reportItem}>
              <h4>Retention Policies</h4>
              <ul>
                {securityReport.retention_policies?.map((policy: any) => (
                  <li key={policy.resource_type}>
                    {policy.resource_type}: {policy.max_age_days} days
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 