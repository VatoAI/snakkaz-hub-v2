
// Service Worker Configuration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, refreshing page...');
              window.location.reload();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

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
