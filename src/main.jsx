import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';
import { AuthProvider, ContentProvider } from './context';
import { ErrorBoundary, ToastProvider } from './components/ui';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ContentProvider>
            <HelmetProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </HelmetProvider>
          </ContentProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  </React.StrictMode>
);
