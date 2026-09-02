// Import direct plutôt que via le barrel `lib/firestore` : ce module est chargé
// par l'arbitre de pop-ups, donc dans le chunk d'entrée — le barrel y tirait
// `certificates.ts` et ses dépendances au passage.
import { captureError } from '../sentry';
import type { PopupId } from './rules';
import { DEFAULT_TREATMENT_SHARE } from './variant';

/**
 * Réglages des pop-ups, pilotés depuis Admin → Paramètres.
 *
 * Ils vivent dans le document public `settings/site`, à côté du reste de la configuration. Le but
 * est opérationnel : couper une sollicitation qui fait fuir ne doit pas attendre un déploiement.
 *
 * ⚠️ La lecture est PARESSEUSE et mise en cache pour la session. Ce module est importé par un
 * composant monté sur toutes les pages publiques : le lire au montage ajouterait une lecture
 * Firestore à chaque page vue. `PopupManager` ne l'appelle qu'une fois une pop-up par ailleurs
 * éligible — donc jamais sur une page vue ordinaire.
 *
 * ⚠️ **Une clé absente vaut ACTIVÉ.** Un site qui n'a jamais ouvert l'écran d'administration doit
 * bénéficier du dispositif sans configuration préalable. Seul un `false` explicite coupe.
 */

export interface PopupSettings {
  enabled: Record<PopupId, boolean>;
  /** Part du trafic exposée aux pop-ups ; le reste sert de groupe témoin. */
  treatmentShare: number;
}

/** Nom du champ Firestore portant l'interrupteur d'une pop-up. */
export const settingsFieldFor = (id: PopupId) => `popup_${id}`;

/** Nom du champ portant la part exposée. */
export const TREATMENT_SHARE_FIELD = 'popupTreatmentShare';

const CACHE_KEY = 'mm-popup-settings';

const ALL_IDS: readonly PopupId[] = [
  'agencyExit', 'formationsEntry', 'formationExit', 'presenceExit', 'blogEnd', 'cartRecovery',
  'clubExit', 'mediaEnd',
];

/** Réglages appliqués quand Firestore est illisible : on n'affiche rien plutôt qu'à tort. */
function failClosed(): PopupSettings {
  const enabled = {} as Record<PopupId, boolean>;
  ALL_IDS.forEach((id) => { enabled[id] = false; });
  return { enabled, treatmentShare: 0 };
}

let pending: Promise<PopupSettings> | null = null;

function parse(data: Record<string, unknown>): PopupSettings {
  const enabled = {} as Record<PopupId, boolean>;
  ALL_IDS.forEach((id) => {
    enabled[id] = data[settingsFieldFor(id)] !== false;
  });

  const rawShare = data[TREATMENT_SHARE_FIELD];
  const share = typeof rawShare === 'number' && rawShare >= 0 && rawShare <= 1
    ? rawShare
    : DEFAULT_TREATMENT_SHARE;

  return { enabled, treatmentShare: share };
}

function readCache(): PopupSettings | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return parse(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    // Cache absent ou illisible — on relira Firestore.
    return null;
  }
}

/**
 * Réglages pour cette session. Une seule lecture Firestore quel que soit le nombre d'appels : le
 * cache de session, puis une promesse partagée, dédoublonnent les appels concurrents.
 */
export async function loadPopupSettings(): Promise<PopupSettings> {
  /* `PopupManager` est monté au démarrage ; les réglages, eux, ne sont lus qu'après.
     L'import dynamique garde `firestore/admin` — donc le SDK — hors de la première vue. */
  const { getSiteSettings } = await import('../firestore/admin');
  const cached = readCache();
  if (cached) return cached;

  if (!pending) {
    pending = getSiteSettings()
      .then((data) => {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // Sans cache, la promesse partagée évite quand même les lectures répétées.
        }
        return parse(data);
      })
      .catch((error: unknown) => {
        captureError(error, { context: 'Load popup settings failed' });
        pending = null; // autorise une nouvelle tentative plus tard dans la session
        return failClosed();
      });
  }

  return pending;
}
