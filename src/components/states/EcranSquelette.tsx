import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Icon, type IconName } from '@ds';
import SEOHead from '../seo/SEOHead';
import LocalizedLink from '../shared/LocalizedLink';

/**
 * L'ÉCRAN SQUELETTE — passe 2 (châssis), 29/10/2026.
 *
 * Chaque écran des maquettes qui n'avait ni route ni page en a désormais une : la coquille
 * de son espace (posée par la route), un titre, et un ÉTAT VIDE HONNÊTE — ce que l'écran
 * fera, et pourquoi il n'affiche rien aujourd'hui. Aucune donnée d'exemple, aucun chiffre
 * (D-09) : un écran sans producteur ne fait pas semblant d'en avoir un.
 *
 * Les lots (A Site, B Edu, C Club, D Console) REMPLACENT ce composant dans la page qui leur
 * revient ; ils ne le modifient pas (fichier partagé, passe 2).
 *
 * Copie : namespace `ecrans`, clés `<ecran>.{eyebrow,title,empty,body}` en FR ET EN.
 * Toujours `noindex` : une page publique squelette ne doit pas être indexée avant d'avoir
 * un contenu ET son entrée dans le pré-rendu du Worker (`static-pages.ts`, `sitemap.ts`).
 */
export interface EcranSqueletteProps {
  /** Clé de l'écran dans le namespace `ecrans` (ex. `edu.cohorte`). */
  ecran: string;
  /** `site` : page publique, gouttière et mesure du site ; `app` : dans une coquille. */
  variant?: 'site' | 'app';
  icon?: IconName;
  /** Liens vers des écrans EXISTANTS qui servent déjà en attendant (jamais une promesse). */
  links?: { to: string; labelKey: string }[];
  children?: ReactNode;
}

export default function EcranSquelette({ ecran, variant = 'app', icon = 'construction', links, children }: EcranSqueletteProps) {
  const { t } = useTranslation('ecrans');
  const k = (s: string) => `${ecran}.${s}`;
  const body = (
    <>
      <SEOHead title={t(k('title'))} description={t(k('empty'))} noIndex />
      <p className="mm-eyebrow m-0 mb-2">{t(k('eyebrow'))}</p>
      <h1 className="font-display text-dsp-sm text-ink m-0 mb-6">{t(k('title'))}</h1>
      <div className="rounded-card border border-[color:var(--line)] bg-bento">
        <EmptyState
          glyph={<Icon name={icon} size={26} strokeWidth={2} />}
          title={t(k('empty'))}
          body={t(k('body'))}
          action={links && links.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {links.map((l) => (
                <LocalizedLink
                  key={l.to}
                  to={l.to}
                  className="mm-touch-extend inline-flex items-center h-10 px-4 rounded-pill border border-[color:var(--line)] text-meta font-semibold text-ink no-underline hover:bg-[color:var(--fill-1)] transition-colors duration-ui"
                >
                  {t(l.labelKey)}
                </LocalizedLink>
              ))}
            </div>
          ) : undefined}
        />
      </div>
      {children}
    </>
  );

  if (variant === 'site') {
    return (
      <div
        className="w-full mx-auto"
        style={{
          maxWidth: 'calc(var(--site-measure, 1200px) + 2 * var(--site-gutter, 40px))',
          padding: 'calc(var(--header-h) + 40px) var(--site-gutter, 40px) 96px',
        }}
      >
        {body}
      </div>
    );
  }
  return <section className="py-2">{body}</section>;
}
