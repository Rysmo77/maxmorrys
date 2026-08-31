import type { ReactNode } from 'react';
import { GlassPanel, Mesh, Wordmark } from '@ds';
import SEOHead from '../seo/SEOHead';
import DsNavHost from '../layout/DsNavHost';
import { SiteDisplay, SiteEyebrow } from './SiteType';
import { useReveal } from './useReveal';

/**
 * LA COQUILLE DES TROIS ÉCRANS DE COMPTE — connexion, création, mot de passe oublié.
 *
 * Structure de la maquette (`ui_kits/plateforme/ScreensCompte.js`) : maillage « Je te forme »,
 * le nom de l'APPLICATION en tête, un titre d'affichage sur deux lignes écrites, puis un
 * `GlassPanel level="hero"` qui contient tout le formulaire.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS CHOSES QUE CETTE COQUILLE DÉCIDE, ET QUI NE SE VOIENT PAS
 *
 * 1. LE NOM AFFICHÉ EST CELUI DE L'APPLICATION, pas de la personne. « Rysmo » est le nom du
 *    produit installable ; « Max-Morrys » est quelqu'un. C'est l'un des cinq écrans où la
 *    distinction est visible — avec le lancement, la bannière d'installation et le /403.
 *
 * 2. LE MAILLAGE EST POSÉ ICI, pas hérité. Ces trois écrans vivent sous `AuthLayout`, hors
 *    de `PublicLayout` — donc hors du `PageMesh` global. Sans ce `Mesh`, ils seraient les
 *    seules pages du produit sur fond blanc nu.
 *
 * 3. AUCUN CHIFFRE. L'écran de connexion portait quatre statistiques de façade — +340 % de
 *    trafic, 50+ étudiants, 94 % de réussite, 10+ cours — alors que la base comptait 5
 *    comptes et 0 formation publiée. C'est l'endroit où le défaut coûtait le plus cher :
 *    on y confie un mot de passe. Rien ne les remplace ; cet écran n'a pas à vendre, la
 *    personne a déjà décidé.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface AuthPageProps {
  /** Écrit ligne par ligne, jamais replié (AD-13). */
  titleLines: string[];
  eyebrow?: string;
  seoTitle: string;
  /** Le formulaire, dans le panneau héros. */
  children: ReactNode;
  /** Ce qui suit le panneau : encart de vérité, lien de bascule. */
  footer?: ReactNode;
  noIndex?: boolean;
}

export function AuthPage({ titleLines, eyebrow, seoTitle, children, footer, noIndex }: AuthPageProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div className="relative min-h-screen isolate overflow-hidden flex items-center justify-center px-[18px] py-16">
      <SEOHead title={seoTitle} noIndex={noIndex} />
      <Mesh territory="forme" />

      <DsNavHost className="relative z-[3] w-full max-w-[440px]">
        <div ref={ref}>
          <div className="rv-s flex justify-center mb-7">
            <Wordmark brand="rysmo" size={24} />
          </div>

          {eyebrow && <SiteEyebrow>{eyebrow}</SiteEyebrow>}
          <SiteDisplay lines={titleLines} size={30} from={eyebrow ? 1 : 0} />

          {/*
            `hero` — voile à .58, AUCUN FLOU. Le kit y mettait un `blur(30px)` ; il l'a perdu
            parce que ce panneau défile sur un écran étroit, et le voile a été recalculé de
            .45 à .58 pour tenir le même contraste sans lui.
          */}
          <GlassPanel
            level="hero"
            padding={22}
            className="rv mt-[18px]"
            style={{ ['--i' as string]: titleLines.length + 2 }}
          >
            {children}
          </GlassPanel>

          {footer}
        </div>
      </DsNavHost>
    </div>
  );
}
