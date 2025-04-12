
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from '@/integrations/supabase/client';

// Initialize Supabase
async function initializeSupabase() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Supabase initialized with session:', session);
    return session;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

// PWA registration function
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker installed, ready to take over');
              // You could show a toast notification here about the update
            }
          });
        }
      });
      
      // Check if there's an existing controller, indicating PWA is already installed
      if (navigator.serviceWorker.controller) {
        console.log('PWA already installed and active');
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  return null;
}

// Initialize app
async function initializeApp() {
  try {
    // Initialize Supabase first
    await initializeSupabase();
    
    // Register service worker
    await registerServiceWorker();
    
    // Get the root element
    const rootElement = document.getElementById("root");
    
    // Ensure the root element exists before rendering
    if (!rootElement) {
      throw new Error("Root element not found! Please check your HTML file.");
    }
    
    // Create root and render the app
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // You might want to show an error UI here
  }
}

// Start the app
initializeApp();
