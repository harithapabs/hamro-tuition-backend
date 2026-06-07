import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const apiBase = (import.meta.env.VITE_API_URL || 'https://hamro-tuition-api.onrender.com').replace(/\/api\/?$/, '');
fetch(`${apiBase}/api/health`, { cache: 'no-store' }).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
