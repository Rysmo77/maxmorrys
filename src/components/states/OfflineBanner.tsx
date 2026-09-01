import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { useOnline } from './useOnline';

/**
 * ── LE BANDEAU HORS CONNEXION ────────────────────────────────────────────────────────
 *
 * `ui_kits/plateforme/ScreensEtats.js`, écran `HorsConnexion`, le résume en pied : « le
 * parcours survit à une session interrompue et reprise des jours plus tard ». Encore
 * faut-il DIRE qu'elle est interrompue — et rien dans ce dépôt ne lisait `navigator.onLine`
 * avant ce bandeau. La coupure se manifestait par des écrans qui ne se remplissent pas.
 *
 * IL NE PROMET RIEN QU'IL NE PUISSE TENIR. Le kit affiche « Tu peux continuer les 3 leçons
 * déjà téléchargées » — un nombre. Celui-ci ne l'écrit pas : la bibliothèque hors connexion
 * (`/hors-connexion`) le connaît et le montre avec le poids de chaque ressource, mesuré par
 * le service worker. Annoncer ici un compte que ce composant ne lit pas serait un nombre
 * sans source, c'est-à-dire le contraire de ce que la règle 6 demande.
 *
 * CHROME FIXE — donc l'un des rares endroits où le flou serait permis (règle 1). Il n'en
 * porte pas : le bandeau est un aplat opaque. Un avertissement qui laisse voir au travers
 * se lit moins bien, et c'est le seul moment où il doit se lire du premier coup.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function OfflineBanner() {
  const online = useOnline();
  const { t } = useTranslation('common');
  const path = useLocalizedPath();

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 px-4 py-3 text-center"
      style={{
        background: 'var(--stop)',
        color: 'var(--on-action)',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
      }}
    >
      <Icon name="alert" size={16} strokeWidth={2.6} />
      <span className="text-meta font-bold">{t('offline.title')}</span>
      {/* `/mon-espace/hors-connexion`, et non `/hors-connexion` : la seconde n'est déclarée
          nulle part (`App.tsx`), donc la SEULE sortie de l'état hors connexion tombait sur la
          404 — au moment précis où la personne n'a plus de réseau pour se rattraper. */}
      <a href={path('/mon-espace/hors-connexion')} className="text-meta underline underline-offset-2">
        {t('offline.link')}
      </a>
    </div>
  );
}
