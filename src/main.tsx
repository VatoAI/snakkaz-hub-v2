
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

function renderApp() {
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
}

// Initialize and render the app
try {
  // Check Supabase connection
  console.log("Checking Supabase connection...");
  supabase.auth.getSession().then(({ data }) => {
    console.log("Supabase session check:", data.session ? "Active session" : "No active session");
  }).catch(error => {
    console.error("Error checking Supabase session:", error);
  });
  
  // Initialize service worker
  registerServiceWorker().then(() => {
    console.log("Service worker registered successfully");
  }).catch(error => {
    console.error("Service worker registration failed:", error);
  });
  
  // Render the app regardless of initialization results
  renderApp();
} catch (error) {
  console.error("Critical error during initialization:", error);
  // Always attempt to render even if there's an error
  renderApp();
}
