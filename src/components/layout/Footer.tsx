import { useTranslation } from 'react-i18next';
import type { ComponentType } from 'react';
import LocalizedLink from '../shared/LocalizedLink';
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, XIcon, YouTubeIcon } from '../shared/SocialIcons';
import { SOCIAL_LINKS } from '../seo/seo-config';
import { useFormat } from '../../hooks/useFormat';
import { contact, corporateUrl, legalEntity, legalName } from '../../lib/brand';
import { Num, Wordmark } from '../../design-system';
import { Icon } from '@ds';

/**
 * LE PIED DE PAGE DU SITE — une dalle d'encre, dans les deux modes.
 *
 * IL PORTE LA PORTÉE `.dk`, ET C'EST LA SEULE FAÇON HONNÊTE DE LE FAIRE (AD-3).
 *
 * Le kit dessine ce pied de page en dur : fond #0A0D11, titres #fff, liens #A7B2BF, et un
 * mot-symbole en variante `night`. Rien de tout ça n'est écrivable ici — la prop de thème
 * n'existe plus, et aucun code hexadécimal n'entre dans un fichier de composant. Le code
 * précédent avait pris l'autre voie : `bg-[color:var(--night-3)] dark:bg-[color:var(--night-2)]`
 * avec du `text-ink-2` par-dessus. En mode CLAIR, `--ink-2` vaut #5A6472 : du gris ardoise sur
 * une dalle presque noire, soit 2,5:1. Le pied de page était illisible la moitié du temps, et
 * personne ne le voyait, parce que tout le monde développe en sombre.
 *
 * « Le thème est une PORTÉE CSS, jamais une variante de composant. » Une région
 * définitivement sombre est donc une région où la portée est posée : `.dk` sur le `<footer>`
 * bascule d'un coup les 78 jetons — l'encre, le verre, les quatre teintes, le corail texte de
 * l'agence, et jusqu'au dégradé de « Hello ! », qui prend sa variante nuit sans qu'on lui
 * passe quoi que ce soit. Aucune couleur n'est écrite, et le mode clair devient lisible.
 *
 * Le mot-symbole est « Hello ! », en type pur, pour 0 octet — pas « MAX-MORRYS » en capitales.
 * Max-Morrys ne survit ici que comme PERSONNE, dans la ligne d'exploitation et le copyright.
 */

const socialIcons: Record<string, ComponentType<{ className?: string }>> = {
  LinkedIn: LinkedInIcon,
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
  TikTok: TikTokIcon,
  X: XIcon,
};

const footerLinks = {
  plateforme: [
    { labelKey: 'links.formations', path: '/formations' },
    // L'offre TPE est entrée dans la navigation principale le 13/08/2026, sous « Je te
    // digitalise » ; elle s'atteint aussi par ici, par la page d'accueil et par le bas de
    // /agence. Le libellé du pied de page reste « Présence Digitale » — c'est un index de
    // destinations, pas la voix de la marque. Voir docs/AGENCY-POSITIONING.md §9.
    { labelKey: 'links.presence', path: '/presence-digitale' },
    { labelKey: 'links.blog', path: '/blog' },
    /*
     * LE TERRITOIRE VIOLET, SES DEUX ÉTAGES, DANS L'ORDRE. Le pied de page listait deux
     * portes du MÊME étage — « Le Podcast du Marketing » et « Le Marketing en Pratique » —
     * vers deux routes qui redirigent depuis leur fusion en un pôle unique, et ne nommait
     * jamais le Club. Le gratuit ouvert d'abord, le payant fermé ensuite : c'est l'ordre que
     * la sous-navigation du territoire tient partout ailleurs.
     */
    { labelKey: 'links.pole', path: '/podcast-et-videos' },
    { labelKey: 'links.club', path: '/club-des-digitos' },
    { labelKey: 'links.faq', path: '/faq' },
  ],
  apropos: [
    { labelKey: 'links.about', path: '/a-propos' },
    { labelKey: 'links.contact', path: '/contact' },
    { labelKey: 'links.booking', path: '/contact' },
    /*
     * « Vérifier un certificat » est au pied de page du kit depuis le début, et la page
     * n'existait pas : le lien manquait ici, faute de destination. Son lecteur n'est pas
     * l'apprenante mais un employeur, et le pied de page est exactement l'endroit où il
     * cherche ce genre d'outil.
     */
    { labelKey: 'links.verify', path: '/verifier' },
    /*
     * « Flux RSS » est une entrée de la colonne « Utile » dans le kit (`reference/site-shell.jsx:16`).
     * Il vivait dans une bande pleine largeur de `py-16` en haut du pied de page, avec un
     * titre en Fraunces 41 px — pour un lien. C'est la seule des deux façons de suivre qui
     * ne demande rien à personne : elle a sa place ici, pas au-dessus de tout le reste.
     */
    { labelKey: 'rss', path: '/rss.xml', external: true },
  ],
  legal: [
    // L'AGENCE EST ICI, ET PAS DANS « PLATEFORME ». Elle vit hors des quatre verbes : autre
    // promesse, autre client, aucune grille tarifaire publique. Le kit la range avec l'entité
    // qui l'opère, et lui donne le corail — la seule entrée colorée du pied de page.
    { labelKey: 'links.agency', path: '/agence', accent: true },
    { labelKey: 'links.legalNotice', path: '/legal/mentions-legales' },
    { labelKey: 'links.privacy', path: '/legal/confidentialite' },
    { labelKey: 'links.cgu', path: '/legal/cgu' },
    { labelKey: 'links.cgv', path: '/legal/cgv' },
    { labelKey: 'links.cookies', path: '/legal/cookies' },
  ],
};

/** Un lien de colonne : encre secondaire au repos, encre pleine au survol. */
const COL_LINK =
  'group inline-flex items-center gap-1 text-meta text-ink-2 hover:text-ink transition-colors duration-ui';

export default function Footer() {
  const { t } = useTranslation('footer');
  const { formatDate } = useFormat();

  const column = (
    titleKey: string,
    links: { labelKey: string; path: string; accent?: boolean; external?: boolean }[],
  ) => (
    <>
      <h3 className="mm-eyebrow mb-5">{t(titleKey)}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.labelKey}>
            {/* Le flux n'est pas une route de l'application : c'est un fichier servi par
                l'hébergement. `LocalizedLink` le préfixerait de `/en` et donnerait un 404. */}
            {link.external ? (
              <a href={link.path} className={COL_LINK}>
                {t(link.labelKey)}
                <Icon name="arrow-up-right" size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-ui" strokeWidth={2.2} />
              </a>
            ) : (
            <LocalizedLink
              to={link.path}
              // `--mm-corail` fait 2,70:1 sur blanc et 7,17:1 sur l'encre : sous `.dk`, la
              // version texte pointe d'elle-même sur la teinte pleine (AD-20).
              className={link.accent ? `${COL_LINK} text-corail-txt hover:text-corail-txt` : COL_LINK}
            >
              {t(link.labelKey)}
              <Icon name="arrow-up-right" size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-ui" strokeWidth={2.2} />
            </LocalizedLink>
            )}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    // `relative z-[1]` : le maillage est fixé à la fenêtre en `z-0`, et le pied de page se
    // pose dessus. `dk` : voir l'en-tête — la dalle sombre est une portée, pas une couleur.
    <footer className="dk relative z-[1] bg-night text-[color:var(--text-body)]">

      {/*
        ── LA BANDE DE SUIVI A ÉTÉ SUPPRIMÉE ────────────────────────────────────────
        Elle occupait `py-16` pleine largeur, avec un titre en `text-dsp` : le pied de page
        faisait à lui seul trois fois la hauteur de celui du kit, sur les vingt routes.

        Le kit n'en dessine aucune (`reference/site-shell.jsx:40-67`) : un seul bloc de 40 px de gouttière,
        quatre colonnes, un filet, une ligne de copyright. « Flux RSS » y est simplement une
        entrée de la colonne « Utile ».

        RIEN N'EST PERDU. Le flux redescend dans la colonne, et la phrase qui explique
        l'absence de lettre d'information — le produit n'a AUCUN canal d'envoi — passe sous le
        copyright, où elle tient sur une ligne au lieu d'une bande.
      */}
      {/* ── Colonnes ──────────────────────────────────────────────────────────── */}
      {/*
        ── LA GOUTTIÈRE DU PIED DE PAGE EST CELLE DU CORPS ─────────────────────────
        Il portait `max-w-7xl mx-auto px-4 stack:px-6 wide:px-8` : une largeur maximale de 1280 px
        centrée, avec un rembourrage de 16 → 32 px. Le corps des pages, lui, n'a pas de largeur
        maximale et prend 18 px sur mobile, 40 en desktop (`--site-pad`).

        Les deux systèmes ne coïncidaient à AUCUNE largeur. Sur un écran de 1440, le contenu de
        la page commençait à 40 px du bord et celui du pied à 112 : soixante-douze pixels de
        décalage entre la première colonne du pied et le titre au-dessus, sur les vingt routes.

        Le kit ne se pose pas la question — son pied de page est un bloc de `padding: 40px`
        dans le même cadre que la page (`reference/site-shell.jsx:84`). C'est ce qu'on reprend : mêmes
        gouttières, donc mêmes bords.
      */}
      {/*
        ⚠️ ET LA MESURE REVIENT — celle-là même qui a été retirée d'ici.

        Le commentaire ci-dessus raconte le retrait de `max-w-7xl mx-auto` : 1280 px centrés,
        exactement le chiffre de la planche du kit. Le diagnostic était juste — le pied et le
        corps « ne coïncidaient à AUCUNE largeur », 72 px de décalage sur les vingt routes —
        mais la conclusion était inversée. Ce n'était pas la mesure du pied qui était fausse,
        c'était son ABSENCE dans le corps.

        Le corps l'a désormais, en jeton (`--site-measure`, voir `index.css`), et `PageSite`
        la sert. Le pied la reprend depuis la MÊME source, avec la même gouttière : les deux
        bords tombent au pixel, à toutes les largeurs, ce que ni l'un ni l'autre des deux
        états précédents ne savait faire.
      */}
      <div
        className="px-[18px] stack:px-10"
        style={{
          maxWidth: 'calc(var(--site-measure, 1200px) + 2 * var(--site-gutter, 40px))',
          marginInline: 'auto',
        }}
      >
        {/* Les proportions du kit : `1.15fr .95fr .95fr .95fr`, gouttière 26, et 40 px
            de rembourrage vertical — `reference/site-shell.jsx:45-46`. */}
        <div className="py-10 grid grid-cols-1 gap-[26px] stack:grid-cols-2 wide:grid-cols-[1.15fr_.95fr_.95fr_.95fr]">

          {/* Marque */}
          <div>
            <LocalizedLink to="/" className="inline-block mb-5">
              <Wordmark brand="hello" size={26} />
            </LocalizedLink>
            <p className="max-w-prose text-meta text-ink-2 leading-relaxed mb-4">
              {t('brandTagline')}
            </p>
            {/*
              L'IDENTITÉ LÉGALE MANQUAIT AU PIED DE PAGE.

              Le kit la pose dans la cellule de marque, sous le mot-symbole : « MY ONOMA SARL /
              Dakar, Senegal / Immatriculée le 11/04/2022 » (`reference/site-shell.jsx:47-49`), la date en
              monospace. Elle avait été remplacée par la seule phrase de positionnement.

              Ce n'est pas une ligne décorative : c'est la mention qui dit QUI encaisse. Sur un
              site qui vend en francs CFA et affiche des CGV, l'opérateur doit être nommé
              ailleurs que dans une page qu'il faut aller ouvrir.

              La date passe par `<Num>` — elle vient des pièces de la société, pas d'une
              estimation, et c'est exactement ce que la monospace déclare.
            */}
            <p className="mb-6 text-small leading-[1.6] text-ink-2">
              <b className="block font-semibold text-ink">{legalName}</b>
              <span className="block">{legalEntity.city}, {legalEntity.country}</span>
              <span className="block">
                {t('registeredOn')}{' '}
                <Num
                  value={formatDate(legalEntity.registeredAt)}
                  /* Le RCCM est la pièce qui porte la date. Il est typé nullable — si la
                     référence venait à manquer, la citation retombe sur la raison sociale
                     plutôt que de disparaître : une date en monospace SANS source citée
                     est exactement ce que la règle 6 interdit. */
                  source={{ cite: legalEntity.rccm ?? legalName }}
                  asOf={new Date(legalEntity.registeredAt)}
                  showAsOf={false}
                />
              </span>
            </p>
            {/*
              LES MOYENS DE JOINDRE, SOUS L'IDENTITÉ QU'ILS PROLONGENT.

              La ville n'est PAS reprise ici : `contact.city` et `legalEntity.city` valent
              tous deux « Dakar », et le pied de page écrivait donc « Dakar, Sénégal » deux
              fois, à quatre-vingts pixels d'intervalle. Une adresse répétée n'ajoute rien —
              elle fait douter qu'il s'agisse du même endroit.
            */}
            <ul className="mb-6 space-y-2 text-meta text-ink-2">
              <li className="flex items-start gap-3">
                <Icon name="mail" size={16} className="mt-0.5 shrink-0" strokeWidth={2.2} />
                <a href={`mailto:${contact.email}`} className="hover:text-ink transition-colors duration-ui">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="phone" size={16} className="mt-0.5 shrink-0" strokeWidth={2.2} />
                {/* `tel:` veut le E.164 ; l'affichage garde sa mise en forme lisible. */}
                <a href={`tel:${contact.phoneE164}`} className="hover:text-ink transition-colors duration-ui">
                  {contact.phoneDisplay}
                </a>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(({ name, url }) => {
                const Icon = socialIcons[name];
                return (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    /* Puits d'icône : `--fill-1` est une teinte de LUMIÈRE sous `.dk`, pas
                       d'encre — c'est ce que l'échelle `--fill-*` existe pour garantir. */
                    className="mm-touch-extend w-9 h-9 rounded-pill bg-[color:var(--fill-1)] hover:bg-[color:var(--fill-2)] flex items-center justify-center text-ink-2 hover:text-ink transition-colors duration-ui"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/*
            ── TROIS COLONNES DE LIENS, UNE PAR CELLULE ─────────────────────────────────
            La troisième cellule en portait DEUX, « À propos » puis « Légal » empilées sous
            un `mt-8`. Onze liens à la verticale : mesurée à 478 px, elle étirait les quatre
            cellules à sa hauteur — c'est une grille — et le pied de page atteignait 650 px
            là où celui du kit en fait 271. Rien ne l'imposait : la grille a quatre pistes,
            et « Contact » n'occupait la sienne que pour trois lignes qui ne sont pas des
            liens. Les moyens de joindre remontent donc dans la cellule de marque, avec
            l'identité légale qu'ils prolongent, et « Légal » prend la piste libérée.
          */}
          <div>{column('columns.platform', footerLinks.plateforme)}</div>
          <div>{column('columns.about', footerLinks.apropos)}</div>
          <div>{column('columns.legal', footerLinks.legal)}</div>
        </div>

        {/* ── Mentions ────────────────────────────────────────────────────────── */}
        {/* Le filet, puis la ligne de copyright en monospace — `reference/site-shell.jsx:63-64`. */}
        <div className="py-4 border-t border-[color:var(--border-hair)] flex flex-col stack:flex-row justify-between items-center gap-3">
          <p className="mm-num m-0 text-small text-ink-2">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-small text-ink-2">
            {t('operatedByPrefix')}{' '}
            <a
              href={corporateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline-offset-2 hover:underline"
            >
              {legalName}
            </a>
          </p>
        </div>

        {/* La phrase qui remplaçait le formulaire de lettre d'information. Elle tenait dans
            une bande de `py-16` ; elle tient sur une ligne. Le produit n'a aucun canal
            d'envoi, et c'est ce qu'elle dit — plutôt qu'un champ qui ne sert à rien. */}
        <p className="pb-6 m-0 text-small leading-[1.5] text-ink-2">{t('noEmail')}</p>
      </div>
    </footer>
  );
}
