import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
/* AD-9 — une surface importe depuis `@ds`, jamais depuis un chemin profond de `react/`.
   Ces trois-là étaient les seuls du dépôt à sauter l'étage : le jour où une primitive change
   de fichier, c'est ce fichier-ci, et lui seul, qui casse sans que rien ne l'ait annoncé. */
import { Button, Icon, IconButton } from '@ds';

/**
 * L'INVITATION À INSTALLER — et tout ce qu'elle refuse de faire.  (AD-17)
 *
 * LE SEUL ARGUMENT D'INSTALLATION QUI VAILLE SUR CE MARCHÉ, C'EST LE FORFAIT ET LE RÉSEAU.
 * Pas la vitesse, pas les notifications. Le panier de données 2 Go coûte en médiane 4,2 % du
 * revenu national brut par habitant : « garde tes leçons hors connexion » est une promesse
 * d'argent économisé, pas une commodité.
 *
 * Trois refus, et chacun corrige un défaut observé ailleurs :
 *
 *   1. JAMAIS EN MODALE. Une modale interrompt exactement ce qu'on était venu faire. Celle-ci
 *      est un bandeau bas : elle attend, elle ne barre pas la route.
 *   2. PAS AVANT LA DEUXIÈME VISITE. Demander à installer à quelqu'un qui n'a pas encore vu
 *      ce que fait le produit, c'est demander avant d'avoir donné.
 *   3. LE LIBELLÉ NE DIT PAS « INSTALLE NOTRE APP ». Il dit ce que ça change pour la
 *      personne. « Notre app » parle du produit ; « tes leçons hors connexion » parle d'elle.
 *
 * Un refus est définitif : on ne redemande pas. Quelqu'un qui a dit non a répondu à la
 * question, et la reposer transforme une invitation en harcèlement.
 */

/** L'événement d'installation, que TypeScript ne connaît pas encore. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISITS_KEY = 'mm-visits';
const DISMISSED_KEY = 'mm-install-dismissed';
const MIN_VISITS = 2;

/** Compte les visites. Appelé une fois au démarrage, avant tout rendu. */
export function countVisit(): void {
  try {
    const n = Number(localStorage.getItem(VISITS_KEY) ?? '0');
    localStorage.setItem(VISITS_KEY, String(n + 1));
  } catch {
    // Mode privé, stockage plein, réglage restrictif : on ne compte pas, donc on
    // n'invite pas. Ne jamais faire échouer un démarrage pour une bannière.
  }
}

export default function InstallInvitation() {
  /* Les cinq chaînes étaient écrites en français, en dur : la bannière serait sortie en
     français sur /en le jour où elle aurait été montée. */
  const { t } = useTranslation('shared');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    let visits = 0;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === '1';
      visits = Number(localStorage.getItem(VISITS_KEY) ?? '0');
    } catch {
      return;
    }
    if (dismissed || visits < MIN_VISITS) return;

    const onPrompt = (e: Event) => {
      // On empêche la bannière native du navigateur pour poser la nôtre — la native
      // apparaît n'importe quand, y compris au milieu d'une leçon.
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const close = (permanent: boolean) => {
    setVisible(false);
    if (permanent) {
      try {
        localStorage.setItem(DISMISSED_KEY, '1');
      } catch {
        /* rien à faire : au pire la bannière reviendra une fois. */
      }
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // Quelle que soit la réponse, on ne redemande pas : la question a été posée.
    close(true);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t('pwa.install.regionLabel')}
      className="glass-flat"
      style={{
        position: 'fixed',
        left: 'var(--sp-12)',
        right: 'var(--sp-12)',
        // Au-dessus de la barre d'onglets, jamais dessous : sinon elle masque la navigation.
        bottom: 'calc(var(--tabbar-h) + var(--sp-12) + env(safe-area-inset-bottom, 0px))',
        zIndex: 60,
        padding: 'var(--pad-panel)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--sp-14)',
        maxWidth: '480px',
        marginInline: 'auto',
      }}
    >
      <span aria-hidden="true" style={{ color: 'var(--mm-bleu)', marginTop: '2px', flex: '0 0 auto' }}>
        <Icon name="download" size={20} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--fs-body)' }}>
          {t('pwa.install.title')}
        </p>
        {/* --text-muted, jamais --text-faint (AD-18). */}
        <p style={{ margin: 0, marginTop: '4px', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('pwa.install.body')}
        </p>
        <div style={{ marginTop: 'var(--sp-14)' }}>
          <Button tone="forme" size="sm" onClick={install}>
            {t('pwa.install.cta')}
          </Button>
        </div>
      </div>

      <IconButton label={t('pwa.install.close')} onClick={() => close(true)}>
        <Icon name="close" size={17} />
      </IconButton>
    </div>
  );
}
