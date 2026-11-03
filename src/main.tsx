import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from './lib/sentry';
import { initWebVitals } from './lib/web-vitals';
import { applyLowFiIfModestDevice } from '@ds';
import { registerServiceWorker } from './lib/pwa/offline';
import { countVisit } from './components/pwa/InstallInvitation';
import { demarrerReceptionTransfert, installerTransfertAuClic, suivreSessionLocale, traiterDemandeRelais } from './lib/sessionHandoff';
import App from './App.tsx';
import './index.css';

// AVANT tout rendu : après, la première image est déjà composée avec les flous, ce qui est
// exactement le coût qu'on cherche à éviter sur un appareil à 2 Go. Règle 5.
applyLowFiIfModestDevice();

initSentry();
initWebVitals();

/* Les trois espaces vivent sur trois hôtes (`lib/espaces.ts`) : une session arrivée par un
   lien d'un autre espace se reçoit AVANT le premier rendu, et les liens sortants la
   transmettent. Voir `lib/sessionHandoff.ts`.
   Une arrivée SANS clic (adresse tapée, favori, nouvel onglet) passe par le relais
   (`lib/sessionRelais.ts`) : sollicitée par un autre espace, la page renvoie aussitôt et
   l'application ne se rend pas. */
const relaisEnCours = traiterDemandeRelais();
demarrerReceptionTransfert();
installerTransfertAuClic();
suivreSessionLocale();

/* La version installable. Le service worker ne précharge que la coquille : tout le reste est
   gardé sur demande explicite, parce qu'un cache qui décide tout seul dépense le forfait de
   quelqu'un d'autre.

   `countVisit()` alimente la règle « pas d'invitation avant la deuxième visite » — demander
   d'installer à qui n'a pas encore vu ce que fait le produit, c'est demander avant d'avoir
   donné. */
if (relaisEnCours) {
  /* L'aller-retour peut durer quelques secondes : jamais une page blanche. Le même rendu que
     l'attente de session des gardes (`ProtectedRoute`), thème lu comme `ThemeContext`. */
  let sombre = false;
  try {
    sombre = localStorage.getItem('mm-theme') === 'dark';
  } catch {
    // Stockage illisible : le clair, défaut du produit.
  }
  const racine = document.documentElement;
  racine.classList.toggle('dk', sombre);
  racine.classList.toggle('dark', sombre);
  const en = (racine.lang || navigator.language || '').toLowerCase().startsWith('en');
  const attente = document.createElement('div');
  attente.className = 'min-h-screen flex items-center justify-center bg-[color:var(--fill-1)] dark:bg-[color:var(--night-2)]';
  attente.setAttribute('role', 'status');
  attente.setAttribute('aria-live', 'polite');
  const texte = document.createElement('p');
  texte.className = 'text-sm text-ink-2';
  texte.textContent = en ? 'Loading your session…' : 'Chargement de ta session…';
  attente.append(texte);
  document.getElementById('root')?.replaceChildren(attente);
} else {
  countVisit();
  void registerServiceWorker();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
