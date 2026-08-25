import { getSiteSettings } from '../firestore';
import { captureError } from '../sentry';

/**
 * Interrupteurs d'affichage des pop-ups, pilotés depuis Admin → Paramètres.
 *
 * Ils vivent dans le document public `settings/site`, à côté du reste de la configuration du
 * site. L'objectif est opérationnel : couper une sollicitation qui fait fuir les visiteurs ne
 * doit pas attendre un déploiement.
 *
 * ⚠️ La lecture est PARESSEUSE et mise en cache pour la session. Ce module est importé par un
 * composant monté sur toutes les pages publiques : le lire au montage ajouterait une lecture
 * Firestore à chaque page vue. `PopupManager` ne l'appelle qu'une fois une pop-up par ailleurs
 * éligible — donc jamais sur une page vue ordinaire.
 */

export interface PopupSettings {
  agencyExit: boolean;
  formationsEntry: boolean;
}

const CACHE_KEY = 'mm-popup-settings';

/** Réglages appliqués quand Firestore est illisible : on n'affiche rien plutôt qu'à tort. */
const FAIL_CLOSED: PopupSettings = { agencyExit: false, formationsEntry: false };

let pending: Promise<PopupSettings> | null = null;

function readCache(): PopupSettings | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PopupSettings>;
    return {
      agencyExit: parsed.agencyExit === true,
      formationsEntry: parsed.formationsEntry === true,
    };
  } catch {
    // Cache absent ou illisible — on relira Firestore.
    return null;
  }
}

/**
 * Réglages des pop-ups pour cette session. Une seule lecture Firestore, quel que soit le nombre
 * d'appels : le cache de session puis une promesse partagée dédoublonnent les appels concurrents.
 *
 * Les clés absentes valent `true` — un site qui n'a jamais ouvert l'écran d'administration doit
 * bénéficier du dispositif sans configuration préalable.
 */
export async function loadPopupSettings(): Promise<PopupSettings> {
  const cached = readCache();
  if (cached) return cached;

  if (!pending) {
    pending = getSiteSettings()
      .then((data) => {
        const parsed: PopupSettings = {
          agencyExit: data.popupAudienceRouter !== false,
          formationsEntry: data.popupFormationsEntry !== false,
        };
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        } catch {
          // Sans cache, la promesse partagée évite quand même les lectures répétées.
        }
        return parsed;
      })
      .catch((error: unknown) => {
        captureError(error, { context: 'Load popup settings failed' });
        pending = null; // autorise une nouvelle tentative plus tard dans la session
        return FAIL_CLOSED;
      });
  }

  return pending;
}
