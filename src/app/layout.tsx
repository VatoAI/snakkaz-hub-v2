import { useEffect } from 'react';
import { registerServiceWorker, handleServiceWorkerUpdate } from '../utils/service-worker';
import { supabase } from '../utils/supabase/client';
import { SecurityManager } from '../utils/security/security-manager';

// Initialize security manager
const securityManager = new SecurityManager();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Register service worker
    if (process.env.NEXT_PUBLIC_SERVICE_WORKER_ENABLED === 'true') {
      registerServiceWorker().then((registration) => {
        if (registration) {
          handleServiceWorkerUpdate(registration);
        }
      });
    }

    // Initialize security features
    if (process.env.NEXT_PUBLIC_SECURITY_ENABLED === 'true') {
      securityManager.cleanupExpiredData();
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <title>Snakkaz</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 