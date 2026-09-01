import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { GlassPanel } from '@ds';
import LocalizedLink from '../shared/LocalizedLink';
import SEOHead from '../seo/SEOHead';
import { PageSite } from './PageSite';
import { SiteDisplay, SiteEyebrow } from './SiteType';

/**
 * LE MOTIF « LECTURE », appliqué aux cinq documents contractuels.
 *
 * Structure de la maquette (`ui_kits/site-public/PagesUtiles.js`, écran `Cgv`) :
 * une grille `250px 1fr`, gouttière 44, avec à gauche une colonne COLLANTE qui liste les cinq
 * documents et donne la version, à droite le titre et la prose.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LA COLONNE DE LECTURE NE S'ÉLARGIT JAMAIS.
 *
 * C'est la seule règle de mise en page que le système déclare non négociable : 68 caractères
 * par ligne, à 1400 px comme à 390. L'espace gagné va à la marge, jamais à la longueur de
 * ligne. Aujourd'hui, aucune page du produit ne l'applique — les cinq documents sont en
 * `max-w-4xl`, soit près du double.
 *
 * Elle est portée par `.mm-prose` (`brand/base.css`), qui pose `max-width: var(--measure-prose)`.
 * On ne la réécrit pas ici : une seconde déclaration serait une seconde vérité.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Pourquoi une colonne de navigation entre documents : les cinq se citent mutuellement, et
 * quelqu'un qui vérifie une clause passe de l'un à l'autre. Un lien « retour à l'accueil »
 * seul l'oblige à repasser par le pied de page à chaque fois.
 */
export interface LegalDoc {
  key: 'cgv' | 'cgu' | 'privacy' | 'mentions' | 'cookies';
  to: string;
  label: string;
}

export const LEGAL_DOCS: LegalDoc[] = [
  { key: 'cgv', to: '/legal/cgv', label: 'Conditions générales de vente' },
  { key: 'cgu', to: '/legal/cgu', label: "Conditions d'utilisation" },
  { key: 'privacy', to: '/legal/confidentialite', label: 'Confidentialité' },
  { key: 'mentions', to: '/legal/mentions-legales', label: 'Mentions légales' },
  { key: 'cookies', to: '/legal/cookies', label: 'Cookies' },
];

export interface LegalPageProps {
  current: LegalDoc['key'];
  eyebrow?: string;
  /** Le titre, écrit ligne par ligne — il ne se replie pas tout seul (AD-13). */
  titleLines: string[];
  seoTitle: string;
  seoDescription: string;
  /** La date de version, affichée sous la colonne de navigation. */
  version: string;
  children: ReactNode;
}

export function LegalPage({
  current, eyebrow, titleLines, seoTitle, seoDescription, version, children,
}: LegalPageProps) {
  const { t } = useTranslation('legal');

  return (
    <PageSite>
      <SEOHead title={seoTitle} description={seoDescription} />

      {/*
        `min-w-0` SUR LES DEUX ENFANTS. Sous `wide`, la grille retombe à une colonne, et un
        élément de grille garde `min-width: auto` : il refuse de descendre sous la largeur
        minimale de son contenu. Un document juridique en contient forcément — une raison
        sociale, un numéro de registre, une adresse électronique ne se coupent pas. Mesuré à
        375 px : `/legal/cgu` élargissait le document à 611 px, `/legal/cgv` à 463.
      */}
      <div className="grid gap-11 items-start wide:grid-cols-[250px_1fr] [&>*]:min-w-0">
        {/* ── La colonne de navigation, collante ────────────────────────────
            `wide:sticky` seulement : sur mobile elle passe au-dessus, en flux, et
            coller une liste de cinq entrées sur un écran de 844 px mangerait le
            tiers du champ de lecture. */}
        <aside className="wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
          <GlassPanel level="flat" padding={20} as="nav" aria-label={t('common.navLabel')}>
            <ul className="list-none m-0 p-0 grid gap-[9px]">
              {LEGAL_DOCS.map((doc) => {
                const active = doc.key === current;
                return (
                  <li key={doc.key}>
                    <LocalizedLink
                      to={doc.to}
                      aria-current={active ? 'page' : undefined}
                      className={`text-[13.5px] no-underline ${
                        active ? 'font-bold text-ink' : 'font-normal text-ink-2 hover:text-ink'
                      }`}
                    >
                      {doc.label}
                    </LocalizedLink>
                  </li>
                );
              })}
            </ul>
          </GlassPanel>

          {/*
            CETTE PHRASE ÉTAIT ÉCRITE EN FRANÇAIS, EN DUR, DANS LE JSX.

            Elle s'affichait telle quelle sur les CINQ pages `/en/legal/*` — CGU, CGV,
            confidentialité, mentions, cookies — au-dessus d'un corps par ailleurs entièrement
            traduit. Et parce qu'elle ne passait par aucune clé, aucun test ne pouvait la
            voir : `i18n-keys.test.ts` compare les catalogues entre eux, il ne sait rien d'un
            littéral. C'est le défaut qu'un `defaultValue` écrit en français produit, en pire.

            --text-muted, jamais --text-faint : l'encre tertiaire ne porte pas de texte.
          */}
          <p className="mt-3 text-small text-ink-2 leading-[1.5]">
            <Trans
              ns="legal"
              i18nKey="common.versionNote"
              values={{ version }}
              components={[<span key="v" className="mm-num" />]}
            />
          </p>
        </aside>

        <div>
          {eyebrow && <SiteEyebrow>{eyebrow}</SiteEyebrow>}
          <SiteDisplay lines={titleLines} size={44} from={eyebrow ? 1 : 0} />

          {/* `.mm-prose` porte la mesure de 68 caractères. Ne pas la redéclarer. */}
          {/* `break-words` : le seul recours pour un jeton qu'aucune langue ne coupe — une
              URL, une adresse électronique, un numéro de registre. Il vaut mieux le couper
              que le laisser pousser la page. */}
          <div className="rv mm-prose mt-[18px] legal-prose break-words" style={{ ['--i' as string]: 2 }}>
            {children}
          </div>
        </div>
      </div>
    </PageSite>
  );
}
