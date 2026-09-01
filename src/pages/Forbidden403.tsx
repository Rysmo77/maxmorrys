import { useTranslation } from 'react-i18next';
import { Button, GlassPanel, Icon, LessonRow } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import DsNavHost from '../components/layout/DsNavHost';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { SiteDisplay, SiteEyebrow } from '../components/site';
import { SUPPORT_SCOPE } from '../lib/adminAccess';

/**
 * /403 — LE SEUL ÉCRAN SOMBRE DU PRODUIT, et c'est délibéré.
 *
 * La maquette (`ui_kits/plateforme/ScreensEtats.js`, écran `Interdit403`) le rend en nuit
 * quand tous les autres écrans suivent le réglage de la personne. La raison tient au sujet :
 * cet écran ne parle pas de contenu, il parle de RÈGLES. Il n'appartient pas au parcours,
 * il l'interrompt.
 *
 * Le mode sombre est posé en PORTÉE CSS locale (`className="dk"`), pas en prop de composant :
 * les 78 jetons qui changent basculent d'un coup, y compris ceux des primitives, sans qu'une
 * seule couleur soit écrite ici. C'est le même mécanisme que le pied de page du site.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CETTE PAGE EST, EXACTEMENT — et son encart de vérité le dit à la personne :
 *
 *   « Un garde de route est du code client : il cache, il n'interdit pas. Le vrai
 *     cloisonnement est dans les règles de la base — cette page dit simplement ce qu'elles
 *     ont déjà refusé. »
 *
 * Ce n'est pas une précaution de rédaction. `src/lib/adminAccess.ts` porte le même
 * avertissement en tête, pour la personne qui écrit le code ; celui-ci est pour la personne
 * qui le subit.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Forbidden403() {
  const { t } = useTranslation('errors');
  /*
   * Les primitives rendent de vrais `<a href>` (AD-6), et `DsNavHost` confie le clic au
   * routeur. Mais il navigue sur le chemin BRUT : l'arbre de routes étant monté deux fois,
   * un `/mon-espace` non localisé enverrait une personne anglophone sur la branche française.
   * Les chemins sont donc localisés avant d'être posés sur les liens.
   */
  const path = useLocalizedPath();
  /*
   * Le rôle vient du PROFIL, pas d'une traduction. Le kit le met en monospace, et sa règle
   * dit pourquoi : la fonte monospace signale une valeur qui vient du système. Écrire
   * « support » en dur ici mentirait à un compte qui aurait un autre rôle.
   */
  const { userData } = useAuth();

  return (
    <div className="dk min-h-screen flex items-center justify-center px-[18px] py-16 bg-[color:var(--night-2)]">
      <SEOHead title={t('forbidden.seoTitle')} noIndex />

      <DsNavHost className="play w-full max-w-[520px]">
        {/*
          Le nombre en filigrane — `.mm-num` à 96 px sur une encre à 14 % d'opacité.
          Il n'est pas décoratif : c'est le seul endroit de l'écran qui nomme le code HTTP,
          et quelqu'un qui cherche « erreur 403 » doit le trouver écrit.
        */}
        <p
          className="mm-num rv-s m-0 leading-none tracking-[-.04em] text-[96px]"
          style={{ color: 'color-mix(in srgb, var(--ink) 14%, transparent)' }}
          aria-hidden="true"
        >
          403
        </p>

        <SiteDisplay
          lines={t('forbidden.titleLines', { returnObjects: true }) as string[]}
          size={30}
          style={{ marginTop: '6px' }}
        />

        <p className="rv mt-3 text-lede text-ink-2" style={{ ['--i' as string]: 4 }}>
          {t('forbidden.textBefore')}
          <b className="mm-num text-ink">{userData?.role ?? 'support'}</b>
          {t('forbidden.textAfter')}
        </p>

        <SiteEyebrow style={{ marginTop: '22px' }}>{t('forbidden.scopeTitle')}</SiteEyebrow>

        {/* `glass-d` — le verre nuit, sans flou : cette liste défile avec la page. */}
        <GlassPanel level="night" padding="4px 18px" as="nav" aria-label={t('forbidden.scopeTitle')}>
          <ul className="list-none m-0 p-0">
            {SUPPORT_SCOPE.map((entry, i) => (
              <li key={entry.to}>
                <LessonRow
                  state="plain"
                  href={path(entry.to)}
                  title={entry.label}
                  icon={<Icon name="check" size={13} color="var(--mm-teal)" strokeWidth={3.4} />}
                  iconBackground="color-mix(in srgb, var(--mm-teal) 18%, transparent)"
                  last={i === SUPPORT_SCOPE.length - 1}
                />
              </li>
            ))}
          </ul>
        </GlassPanel>

        <GlassPanel level="night" padding={18} className="rv mt-4" style={{ ['--i' as string]: 6 }}>
          <SiteEyebrow style={{ marginBottom: '6px' }}>{t('forbidden.truthTitle')}</SiteEyebrow>
          <p className="m-0 text-meta-2 text-ink-2 leading-[1.55]">{t('forbidden.truthBody')}</p>
        </GlassPanel>

        <div className="mt-5 flex flex-col stack:flex-row gap-3">
          <Button href={path('/mon-espace')} tone="primary" size="sm" fullWidth={false}>
            {t('forbidden.space')}
          </Button>
          <Button href={path('/')} tone="quiet" size="sm" fullWidth={false}>
            {t('forbidden.home')}
          </Button>
        </div>
      </DsNavHost>
    </div>
  );
}
