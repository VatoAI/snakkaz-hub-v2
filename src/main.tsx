
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from '@/integrations/supabase/client';
import { registerServiceWorker } from '@/utils/service-worker';

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
