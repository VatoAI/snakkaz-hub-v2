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
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Analytics blocking
export const blockAnalytics = () => {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') {
    // Block Cloudflare Insights
    const script = document.createElement('script');
    script.textContent = `
      window.addEventListener('load', function() {
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.addedNodes) {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeName === 'SCRIPT' && 
                    node.src && 
                    node.src.includes('cloudflareinsights.com')) {
                  node.remove();
                }
              });
            }
          });
        });
        
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      });
    `;
    document.head.appendChild(script);
  }
};

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