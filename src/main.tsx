
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from "./integrations/supabase/client"
import { registerServiceWorker } from "./utils/service-worker"

// Ensure __WS_TOKEN__ is defined globally
declare global {
  var __WS_TOKEN__: string;
}

async function initializeApp() {
  try {
    // Initialize service worker
    await registerServiceWorker();
    
    // Check Supabase session
    try {
      const { data } = await supabase.auth.getSession();
      console.log("Supabase session check:", data.session ? "Active session" : "No active session");
    } catch (error) {
      console.error("Error checking Supabase session:", error);
    }
    
    // Render app
    const rootElement = document.getElementById('root');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    } else {
      console.error("Root element not found");
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);
    
    // Fallback rendering in case of error
    const rootElement = document.getElementById('root');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    }
  }
}

initializeApp().catch(console.error);
