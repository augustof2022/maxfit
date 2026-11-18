import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// The reward card's display face, self-hosted (works offline in the APK). The UI uses the system sans.
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import './styles.css';
import './styles-avatar.css';
import './styles-extra.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
