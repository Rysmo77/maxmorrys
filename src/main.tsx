import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from './lib/sentry';
import { initWebVitals } from './lib/web-vitals';
import { applyLowFiIfModestDevice } from './design-system/lowfi';
import { registerServiceWorker } from './lib/pwa/offline';
import { countVisit } from './components/pwa/InstallInvitation';
import App from './App.tsx';
import './index.css';

// AVANT tout rendu : après, la première image est déjà composée avec les flous, ce qui est
// exactement le coût qu'on cherche à éviter sur un appareil à 2 Go. Règle 5.
applyLowFiIfModestDevice();

initSentry();
initWebVitals();

/* La version installable. Le service worker ne précharge que la coquille : tout le reste est
   gardé sur demande explicite, parce qu'un cache qui décide tout seul dépense le forfait de
   quelqu'un d'autre.

   `countVisit()` alimente la règle « pas d'invitation avant la deuxième visite » — demander
   d'installer à qui n'a pas encore vu ce que fait le produit, c'est demander avant d'avoir
   donné. */
countVisit();
void registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
