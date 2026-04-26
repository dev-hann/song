import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { App } from './App';
import { initErrorReporter } from './lib/error-reporter';
import { useAudioStore } from './store';
import { AudioStatus } from './constants';
import './styles/globals.css';

initErrorReporter();

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    const { status } = useAudioStore.getState();
    if (status === AudioStatus.PLAYING || status === AudioStatus.LOADING) {
      useAudioStore.subscribe((state) => {
        const idle = state.status === AudioStatus.IDLE || state.status === AudioStatus.PAUSED;
        if (idle && !refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
      return;
    }
    refreshing = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
