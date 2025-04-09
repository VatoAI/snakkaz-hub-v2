
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Get the root element
const rootElement = document.getElementById("root");

// Ensure the root element exists before rendering
if (!rootElement) {
  throw new Error("Root element not found! Please check your HTML file.");
}

// Create root and render the app
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
