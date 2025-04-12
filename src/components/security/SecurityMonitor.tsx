import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './SecurityMonitor.module.css';

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  corsViolations: number;
  securityHeaders: {
    [key: string]: boolean;
  };
  analyticsBlocked: number;
  lastUpdated: string;
}

export default function SecurityMonitor() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRequests: 0,
    blockedRequests: 0,
    corsViolations: 0,
    securityHeaders: {},
    analyticsBlocked: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('security_metrics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        setMetrics(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch security metrics');
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading security metrics...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Security Monitor</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Request Statistics</h3>
          <div className={styles.metric}>
            <span>Total Requests:</span>
            <span>{metrics.totalRequests}</span>
          </div>
          <div className={styles.metric}>
            <span>Blocked Requests:</span>
            <span>{metrics.blockedRequests}</span>
          </div>
          <div className={styles.metric}>
            <span>CORS Violations:</span>
            <span>{metrics.corsViolations}</span>
          </div>
          <div className={styles.metric}>
            <span>Analytics Blocked:</span>
            <span>{metrics.analyticsBlocked}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Security Headers</h3>
          {Object.entries(metrics.securityHeaders).map(([header, enabled]) => (
            <div key={header} className={styles.metric}>
              <span>{header}:</span>
              <span className={enabled ? styles.enabled : styles.disabled}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
} 