import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { tauriApi } from './lib/tauri-bridge.ts';

// Assign Tauri implementation to window.electronAPI so all existing hooks
// work without modification.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).electronAPI = tauriApi;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).electron = tauriApi;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
