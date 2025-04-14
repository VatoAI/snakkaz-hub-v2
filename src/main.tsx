
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from "./integrations/supabase/client"
import { registerServiceWorker } from "./utils/service-worker"

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
  }
}

initializeApp().catch(console.error);
