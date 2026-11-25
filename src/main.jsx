import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SessionProvider } from './context/SessionProvider';
import './styles/index.css';
import './styles/workspaceAnimations.css';

const navigationEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
if (navigationEntry?.type === 'reload' && window.location.pathname !== '/') {
  window.history.replaceState(null, '', '/');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
