export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: process.env.NEXT_PUBLIC_SERVICE_WORKER_SCOPE || '/'
      });

      console.log('Service Worker registered:', registration);

      // Update meta tags
      updateMetaTags();

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

function updateMetaTags() {
  if (typeof document !== 'undefined') {
    // Remove deprecated meta tag
    const deprecatedMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (deprecatedMeta) {
      deprecatedMeta.remove();
    }

    // Add modern meta tag
    const metaTag = document.createElement('meta');
    metaTag.name = 'mobile-web-app-capable';
    metaTag.content = 'yes';
    document.head.appendChild(metaTag);
  }
}

// Handle service worker updates
export function handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    // New service worker is waiting
    if (confirm('A new version is available! Would you like to update?')) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Listen for controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
} 