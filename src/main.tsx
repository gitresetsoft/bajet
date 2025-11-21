import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandlers } from './lib/errorHandler'
import { initSentry } from './lib/sentry'

// Initialize Sentry first (before other code)
initSentry()

// Setup global error handlers
setupGlobalErrorHandlers()

createRoot(document.getElementById("root")!).render(<App />);
