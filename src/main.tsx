import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";

// Patch showPicker to prevent SecurityError in iframes
if (typeof HTMLInputElement !== 'undefined' && 'showPicker' in HTMLInputElement.prototype) {
  const originalShowPicker = HTMLInputElement.prototype.showPicker;
  HTMLInputElement.prototype.showPicker = function() {
    try {
      originalShowPicker.call(this);
    } catch (e) {
      console.warn('showPicker failed (likely due to iframe restrictions):', e);
    }
  };
}

import { ErrorBoundary } from "./components/ui/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
