import { useCallback, useEffect, useState } from 'react';
import { useBlocker, useLocation, type BlockerFunction } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { COOKIE_CONSENT_EVENT, getCookieConsent } from '../shared/CookieBanner';
import { toCanonicalPath } from '../../i18n/routing';
import { trackEvent } from '../../lib/tracking';
import { getPublishedFormations } from '../../lib/firestore';
import type { Formation } from '../../types';
import { captureEntrySource, type EntrySource } from '../../lib/popups/entrySource';
import { loadPopupSettings, type PopupSettings } from '../../lib/popups/settings';
import { canShow, markShown, type PopupId } from '../../lib/popups/rules';
import { useExitIntent } from '../../hooks/useExitIntent';
import PopupSurface from './PopupSurface';
import AudienceRouterPopup from './AudienceRouterPopup';
import FormationsEntryPopup from './FormationsEntryPopup';

/**
 * Arbitre UNIQUE des pop-ups contextuelles du site public.
 *
 * ⚠️ Ne jamais laisser un composant de pop-up décider seul de s'afficher. Le site empile déjà
 * quatre couches flottantes (bandeau cookies, suggestion de langue, bannière d'annonce, bouton
 * WhatsApp collant) : sans point de décision unique, un visiteur en reçoit plusieurs d'affilée.
 * Toute nouvelle pop-up passe par ici, par `lib/popups/rules.ts` pour ses plafonds, et par
 * `PopupSurface` pour sa surface d'affichage.
 *
 * Monté dans `PublicLayout` — donc jamais sur le LMS, l'authentification ni l'administration.
 */

type PopupTrigger = 'exitIntent' | 'navigation' | 'dwell' | 'scroll';

interface ActivePopup {
  id: PopupId;
  trigger: PopupTrigger;
}

/** Chemin canonique de la page d'agence — la seule où l'aiguilleur d'audience a du sens. */
const AGENCY_PATH = '/agence';

/**
 * Chemins où « Je te forme » ne doit JAMAIS s'inviter.
 *
 * `/formations` : le visiteur y est déjà. `/agence` : l'aiguilleur d'audience y règne, deux
 * sollicitations sur la même page seraient absurdes. `/presence-digitale` et `/checkout` sont des
 * tunnels commerciaux — on ne détourne pas un visiteur en train de convertir, et cela évite au
 * passage la collision avec le bouton WhatsApp collant en bas de `/presence-digitale`.
 */
const FORMATIONS_EXCLUDED_PATHS: readonly string[] = [
  '/formations',
  '/agence',
  '/presence-digitale',
  '/checkout',
];

/** Contextes d'arrivée qui justifient de présenter l'offre de formation. */
const FORMATIONS_SOURCES: readonly EntrySource[] = ['search', 'clientFooter'];

/** Temps de présence avant de proposer les formations, en millisecondes. */
const DWELL_MS = 25000;

/** Profondeur de lecture alternative — la première des deux conditions déclenche. */
const SCROLL_THRESHOLD = 0.4;

/** Retire un éventuel `/` final pour que `/agence/` et `/agence` se comparent à l'identique. */
function normalizePath(pathname: string): string {
  const canonical = toCanonicalPath(pathname);
  return canonical.length > 1 && canonical.endsWith('/') ? canonical.slice(0, -1) : canonical;
}

function isUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

export default function PopupManager() {
  const { t } = useTranslation('shared');
  const { pathname } = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [source, setSource] = useState<EntrySource>('unknown');
  /*
    Le consentement vit dans `localStorage` : rien ne le rend réactif. Sans cet état, un visiteur
    qui accepte les cookies PUIS quitte la page ne verrait rien — les déclencheurs étaient
    désarmés au moment du dernier rendu et rien ne les réveillerait.
  */
  const [consentGiven, setConsentGiven] = useState(() => getCookieConsent() !== null);
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [active, setActive] = useState<ActivePopup | null>(null);
  const [featured, setFeatured] = useState<Formation | null>(null);

  const path = normalizePath(pathname);
  const activeTrigger = active?.trigger ?? null;

  // Le referrer n'est exploitable qu'au premier chargement : on le classe une fois pour la session.
  useEffect(() => {
    setSource(captureEntrySource());
  }, []);

  useEffect(() => {
    const sync = () => setConsentGiven(getCookieConsent() !== null);
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  // Éligibilité « bon marché » : chemin, contexte d'arrivée, plafonds locaux. Aucun réseau.
  const agencyCandidate = consentGiven && path === AGENCY_PATH && canShow('agencyExit');
  const formationsCandidate = consentGiven && !authLoading && !user
    && FORMATIONS_SOURCES.includes(source)
    && !FORMATIONS_EXCLUDED_PATHS.some((excluded) => isUnder(path, excluded))
    && canShow('formationsEntry');

  // La lecture Firestore n'a lieu QUE si une pop-up a réellement une chance de s'afficher.
  useEffect(() => {
    if (settings || (!agencyCandidate && !formationsCandidate)) return;
    let alive = true;
    loadPopupSettings().then((loaded) => {
      if (alive) setSettings(loaded);
    });
    return () => { alive = false; };
  }, [settings, agencyCandidate, formationsCandidate]);

  const agencyExitReady = agencyCandidate && settings?.agencyExit === true && active === null;
  const formationsEnabled = formationsCandidate && settings?.formationsEntry === true;
  const formationsReady = formationsEnabled && active === null;

  /*
    Préchargement de la formation vedette, dès que la pop-up devient plausible — donc bien avant
    ses 25 s de temporisation. Sans cette avance, la fiche arriverait après l'ouverture et
    décalerait la mise en page sous les yeux du visiteur.

    Volontairement gardé par `formationsEnabled` et non par `formationsReady` : ce dernier
    retombe à `false` à l'ouverture, ce qui annulerait le chargement au pire moment. L'échec
    n'est jamais bloquant — la pop-up s'affiche avec son texte statique.
  */
  useEffect(() => {
    if (!formationsEnabled || featured) return;
    let alive = true;
    getPublishedFormations()
      .then((list) => {
        if (!alive || list.length === 0) return;
        setFeatured(list.find((f) => f.featured) ?? list[0]);
      })
      .catch(() => {
        // Catalogue illisible : repli textuel, rien à remonter.
      });
    return () => { alive = false; };
  }, [formationsEnabled, featured]);

  const open = useCallback((id: PopupId, trigger: PopupTrigger) => {
    markShown(id); // consomme le plafond de session AVANT l'affichage : une seule pop-up passera
    setActive({ id, trigger });
    trackEvent('popup_impression', { popup_id: id, trigger });
  }, []);

  // ── Aiguilleur d'audience — déclencheur 1 : la souris quitte le document par le haut ────────
  const handleExitIntent = useCallback(() => { open('agencyExit', 'exitIntent'); }, [open]);
  useExitIntent(agencyExitReady, handleExitIntent);

  // ── Aiguilleur d'audience — déclencheur 2 : navigation interne quittant /agence ─────────────
  /*
    `useBlocker` couvre le clic sur un lien du menu ET le bouton retour tant qu'on reste dans la
    SPA. Il ne couvre pas la fermeture d'onglet — aucun navigateur ne le permet, voir
    `useExitIntent`. Le prédicat retombe à `false` dès que la pop-up s'ouvre (`agencyExitReady`
    inclut `active === null`) et dès que le plafond de session est consommé : la navigation
    suivante passe donc sans interception, conformément au « on bloque une fois ».
  */
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      agencyExitReady && currentLocation.pathname !== nextLocation.pathname,
    [agencyExitReady],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state === 'blocked' && active === null) {
      open('agencyExit', 'navigation');
    }
  }, [blocker.state, active, open]);

  // ── Formations — déclencheur : 25 s de présence OU 40 % de lecture, le premier des deux ─────
  useEffect(() => {
    if (!formationsReady) return;

    let fired = false;
    const fire = (trigger: PopupTrigger) => {
      if (fired) return;
      fired = true;
      open('formationsEntry', trigger);
    };

    const timer = window.setTimeout(() => fire('dwell'), DWELL_MS);
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= SCROLL_THRESHOLD) fire('scroll');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [formationsReady, open]);

  // ── Fermetures ──────────────────────────────────────────────────────────────────────────────
  /*
    Fermer la fenêtre POURSUIT la navigation interceptée, jamais l'annule : le visiteur avait
    demandé à aller quelque part, on l'a interrompu, il refuse l'interruption. L'y retenir serait
    un dark pattern. Seul un choix de porte annule la navigation d'origine — il la remplace.
  */
  const handleAgencyLeave = useCallback((destination: string) => {
    trackEvent('popup_dismiss', { popup_id: 'agencyExit', trigger: activeTrigger, destination });
    setActive(null);
    if (blocker.state === 'blocked') blocker.proceed();
  }, [blocker, activeTrigger]);

  const handleAgencyChoose = useCallback((destination: 'build' | 'presence' | 'learn') => {
    trackEvent('popup_click', { popup_id: 'agencyExit', trigger: activeTrigger, destination });
    setActive(null);
    // Un choix de porte REMPLACE la navigation interceptée : on l'abandonne au lieu de la reprendre.
    if (blocker.state === 'blocked') blocker.reset();
    /*
      Filet pour la porte BUILD, qui est une simple ancre `#projet`. Tant que la modale est
      montée, `ui/Modal` maintient `body { overflow: hidden }` : si le saut de fragment natif
      part avant que le démontage n'ait rendu la page scrollable, il ne va nulle part. On
      repositionne donc explicitement à la frame suivante — sans effet si le saut a déjà eu lieu.
    */
    if (destination === 'build') {
      requestAnimationFrame(() => {
        document.getElementById('projet')?.scrollIntoView({ block: 'start' });
      });
    }
  }, [blocker, activeTrigger]);

  const handleFormationsDismiss = useCallback(() => {
    trackEvent('popup_dismiss', { popup_id: 'formationsEntry', trigger: activeTrigger, destination: 'close' });
    setActive(null);
  }, [activeTrigger]);

  const handleFormationsAccept = useCallback(() => {
    trackEvent('popup_click', { popup_id: 'formationsEntry', trigger: activeTrigger, destination: 'formations' });
    setActive(null);
  }, [activeTrigger]);

  if (!active) return null;

  if (active.id === 'agencyExit') {
    return (
      <PopupSurface
        open
        onClose={() => handleAgencyLeave('close')}
        title={t('popups.agencyExit.title')}
        size="lg"
        mobileSurface="modal"
      >
        <AudienceRouterPopup
          onChoose={handleAgencyChoose}
          onContinue={() => handleAgencyLeave('continue')}
        />
      </PopupSurface>
    );
  }

  return (
    <PopupSurface
      open
      onClose={handleFormationsDismiss}
      title={t('popups.formationsEntry.title')}
      size="md"
      mobileSurface="sheet"
    >
      <FormationsEntryPopup
        formation={featured}
        onAccept={handleFormationsAccept}
        onDismiss={handleFormationsDismiss}
      />
    </PopupSurface>
  );
}
