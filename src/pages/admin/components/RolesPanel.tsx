import { useTranslation } from 'react-i18next';
import { DocLine, GlassPanel, Num } from '@ds';
import { SiteEyebrow } from '../../../components/site';
import { SUPPORT_SCOPE } from '../../../lib/adminAccess';
import { ADMIN_SCREEN_COUNT } from '../../../lib/admin/consoleNav';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RÔLES ET PORTÉE — troisième colonne de l'écran des paramètres.
 *
 * `handoff_tableaux_de_bord/dashboards-console-2.jsx` § ParametresDesktop.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES DEUX NOMBRES SONT COMPTÉS, JAMAIS ÉCRITS.
 *
 * La maquette écrit « administrateur · 19 écrans » et « support · 5 écrans ». Ces deux
 * nombres sont vrais le jour où on les tape et faux au premier écran ajouté — et c'est
 * précisément ce que la règle 6 range du côté des données d'exemple : « un mensonge
 * qu'on oublie de retirer ». Ils sont donc dérivés :
 *
 *   · `ADMIN_SCREEN_COUNT` = la longueur de la table qui construit le menu ;
 *   · `SUPPORT_SCOPE.length` = la longueur de la table que lit AUSSI le garde de route.
 *
 * Ajouter un écran met les deux à jour, sans que personne ait à y penser. C'est la seule
 * façon d'écrire un chiffre sur un écran d'administration : le faire compter par ce qui
 * l'exécute.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET LE SECOND BLOC EST LE PLUS IMPORTANT DES DEUX.
 *
 * « Un garde de route est du code client : il CACHE, il n'interdit pas. » Le vrai
 * cloisonnement vit dans `firestore.rules`, qui distingue `isAdmin()` de
 * `isAdminOrSupport()`. Quelqu'un qui lit « support · 5 écrans » sans lire cette phrase
 * en conclut que le rôle support est confiné — il ne l'est qu'à l'affichage. Un
 * garde-fou dont on croit à tort qu'il tient côté serveur est pire que pas de garde-fou.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function RolesPanel() {
  const { t } = useTranslation('admin');
  /*
    LA PORTÉE EST UNE TABLE DE CODE, PAS UNE LECTURE — donc `source={{ cite }}`.

    <Num> n'admet que trois provenances : `db` (lu en base), `server` (recalculé côté
    serveur) et `{ cite }` (« sourcé hors du produit : la source se cite, et elle
    s'affiche »). Ces deux comptes ne viennent d'aucune requête : ils viennent de deux
    fichiers du dépôt. Les annoncer `db` serait affirmer un relevé qu'on n'a pas fait ;
    citer le fichier dit exactement d'où sort le nombre, et où aller le changer.
  */
  const asOf = new Date();
  const NAV_SRC = { cite: 'lib/admin/consoleNav.ts' } as const;
  const SCOPE_SRC = { cite: 'lib/adminAccess.ts' } as const;

  return (
    <>
      <SiteEyebrow>{t('settings.panelRolesEyebrow')}</SiteEyebrow>

      <GlassPanel level="night" padding={18} className="rv mt-3" style={{ ['--i' as string]: 1 }}>
        <DocLine
          label={t('settings.roleAdmin')}
          value={(
            <>
              <Num value={ADMIN_SCREEN_COUNT} source={NAV_SRC} asOf={asOf} />{' '}
              {t('settings.roleScreens', { count: ADMIN_SCREEN_COUNT })}
            </>
          )}
        />
        <DocLine
          label={t('settings.roleSupport')}
          value={(
            <>
              <Num value={SUPPORT_SCOPE.length} source={SCOPE_SRC} asOf={asOf} />{' '}
              {t('settings.roleScreens', { count: SUPPORT_SCOPE.length })}
            </>
          )}
        />
        <DocLine label={t('settings.roleStudent')} value={t('settings.roleNone')} last />
      </GlassPanel>

      {/* Les cinq écrans que le rôle support atteint, nommés. Les compter sans les nommer
          oblige à ouvrir le code pour répondre à « est-ce que je peux lui donner ce rôle ». */}
      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 2 }}>
        <SiteEyebrow style={{ marginBottom: '8px' }}>{t('settings.panelSupportScopeTitle')}</SiteEyebrow>
        <ul className="m-0 list-none p-0">
          {SUPPORT_SCOPE.map((s) => (
            <li key={s.to} className="text-meta-2 leading-[1.7] text-ink-2">
              {s.label}
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 3 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('settings.panelGuardTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('settings.panelGuardBody')}</p>
      </GlassPanel>

      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 4 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('settings.panelMirrorTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('settings.panelMirrorBody')}</p>
      </GlassPanel>
    </>
  );
}
