import type { ReactNode } from 'react';
import { GlassPanel } from '@ds';
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
  /**
   * LA SECONDE COLONNE — le kit dessine la connexion en DEUX colonnes de largeur égale
   * (`PagesUtiles.js:149`) : le formulaire à gauche, la remise en selle à droite. Quand elle
   * est fournie, la coquille passe en grille et s'élargit à la gouttière du site ; sans elle,
   * elle garde sa colonne unique de 440 px, qui reste la bonne forme pour l'inscription et
   * pour la page de mot de passe oublié atteinte directement.
   */
  aside?: ReactNode;
  noIndex?: boolean;
}

export function AuthPage({ titleLines, eyebrow, seoTitle, children, footer, aside, noIndex }: AuthPageProps) {
  const ref = useReveal<HTMLDivElement>();
  const deuxColonnes = Boolean(aside);

  return (
    /*
      PLUS DE MAILLAGE NI DE MOT-SYMBOLE ICI. Ces trois écrans vivent désormais sous
      `PublicLayout`, qui pose déjà `PageMesh` et la barre haute : un second `Mesh` en aurait
      empilé deux, et le `Wordmark` centré doublait celui du chrome. C'est le kit qui tranche —
      sa page de connexion est une page du site comme une autre.
    */
    /*
      ⚠️ LA RÉFÉRENCE DE SCÈNE EST ICI, ET PAS SUR LA COLONNE DU FORMULAIRE.

      Elle était posée sur le `<div>` qui enveloppe le panneau héros — donc `.play` n'arrivait
      QUE sur la première colonne. `motion.css` pose `.rv{opacity:0}` et ne le relève que sous
      `.play` : les deux panneaux de la colonne `aside` restaient donc à `opacity: 0` POUR
      TOUJOURS, sur tous les écrans, sans erreur ni avertissement nulle part.

      Ce que ça coûtait : la moitié droite de la page de connexion — la remise en selle du mot
      de passe oublié et l'encart de vérité — était invisible, et la carte du formulaire
      semblait plaquée à gauche d'une colonne vide de 1180 px.

      Le `ref` monte donc sur l'enveloppe, qui contient les DEUX colonnes. C'est déjà ce que
      fait `PageSite` avec la sienne — la scène appartient à la page, pas à l'un de ses blocs.
    */
    <div
      ref={ref}
      className={deuxColonnes ? 'px-[18px] py-12' : 'px-[18px] py-12 flex justify-center'}
    >
      <SEOHead title={seoTitle} noIndex={noIndex} />

      {/*
        1200, PAS 1180 — la mesure du site, prise à sa source.

        Ces vingt pixels d'écart ne se voient pas seuls ; ils se voient au bord. La carte de
        connexion, la pilule de la barre haute et la première colonne du pied de page sont
        empilées dans le même axe : deux d'entre elles tombaient sur la colonne du kit, la
        troisième vingt pixels en dedans. C'est le même défaut que celui décrit dans
        `Footer.tsx` — deux systèmes de largeur qui ne coïncident à aucune largeur — en plus
        discret. Le jeton l'empêche de revenir.
      */}
      <DsNavHost
        className={
          deuxColonnes
            ? 'relative z-[3] mx-auto grid w-full items-start gap-10 wide:grid-cols-2'
            : 'relative z-[3] w-full max-w-[440px]'
        }
        style={deuxColonnes ? { maxWidth: 'var(--site-measure, 1200px)' } : undefined}
      >
        <div>
          {/*
            `hero` — voile à .58, AUCUN FLOU. Le kit y mettait un `blur(30px)` ; il l'a perdu
            parce que ce panneau défile, et le voile a été recalculé de .45 à .58 pour tenir le
            même contraste sans lui.

            EN DEUX COLONNES, LE TITRE EST DANS LE PANNEAU — c'est la composition du kit
            (`PagesUtiles.js:150-151`) : « Content de te revoir. » ouvre la carte, il ne la
            surplombe pas. En colonne unique il reste au-dessus, où il sert de titre de page.
          */}
          {!deuxColonnes && eyebrow && <SiteEyebrow>{eyebrow}</SiteEyebrow>}
          {!deuxColonnes && <SiteDisplay lines={titleLines} size={30} from={eyebrow ? 1 : 0} />}

          <GlassPanel
            level="hero"
            padding={deuxColonnes ? 30 : 22}
            className={deuxColonnes ? 'rv' : 'rv mt-[18px]'}
            style={{ ['--i' as string]: titleLines.length + 2 }}
          >
            {deuxColonnes && (
              <>
                {eyebrow && <SiteEyebrow>{eyebrow}</SiteEyebrow>}
                <SiteDisplay lines={titleLines} size={36} from={eyebrow ? 1 : 0} />
              </>
            )}
            {children}
          </GlassPanel>

          {footer}
        </div>

        {aside}
      </DsNavHost>
    </div>
  );
}
