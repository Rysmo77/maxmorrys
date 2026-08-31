import { useTranslation } from 'react-i18next';
import type { ComponentType } from 'react';
import LocalizedLink from '../shared/LocalizedLink';
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, XIcon, YouTubeIcon } from '../shared/SocialIcons';
import { SOCIAL_LINKS } from '../seo/seo-config';
import { contact, corporateUrl, legalName } from '../../lib/brand';
import { Button, Wordmark } from '../../design-system';
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

  const column = (titleKey: string, links: { labelKey: string; path: string; accent?: boolean }[]) => (
    <>
      <h3 className="mm-eyebrow mb-5">{t(titleKey)}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.labelKey}>
            <LocalizedLink
              to={link.path}
              // `--mm-corail` fait 2,70:1 sur blanc et 7,17:1 sur l'encre : sous `.dk`, la
              // version texte pointe d'elle-même sur la teinte pleine (AD-20).
              className={link.accent ? `${COL_LINK} text-corail-txt hover:text-corail-txt` : COL_LINK}
            >
              {t(link.labelKey)}
              <Icon name="arrow-up-right" size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-ui" strokeWidth={2.2} />
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    // `relative z-[1]` : le maillage est fixé à la fenêtre en `z-0`, et le pied de page se
    // pose dessus. `dk` : voir l'en-tête — la dalle sombre est une portée, pas une couleur.
    <footer className="dk relative z-[1] bg-night text-[color:var(--text-body)]">

      {/* ── Lettre d'information ──────────────────────────────────────────────── */}
      <div className="border-b border-[color:var(--border-hair)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mx-auto text-center">
            <p className="mm-eyebrow">{t('newsletterEyebrow')}</p>
            {/* Fraunces 900, jamais sous 22 px. `text-dsp-sm` vaut 30 px, `text-dsp` 41. */}
            <h2 className="font-display text-dsp-sm stack:text-dsp mt-4 mb-4 text-ink">
              {t('followTitle')}
            </h2>
            {/* AD-14 : la colonne de lecture ne s'élargit jamais — 68 caractères, à 1400 px
                comme à 390. L'espace gagné va à la marge. */}
            <p className="max-w-prose mx-auto text-lede text-ink-2 mb-8">
              {t('followText')}
            </p>
            {/*
              LE FORMULAIRE DE LETTRE D'INFORMATION A ÉTÉ RETIRÉ.

              Le produit n'a AUCUN canal d'envoi d'e-mail. Un champ qui collecte une adresse
              pour un envoi qui n'existe pas est une promesse qu'on ne peut pas tenir — et le
              système l'interdit nommément : « ne jamais promettre un e-mail ».

              Ce qui le remplace n'est pas un vide : ce sont les deux canaux qui EXISTENT,
              plus la phrase qui dit pourquoi le troisième n'est pas là.
            */}
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border-hair)] py-[11px]">
                <b className="text-[14px]">{t('rss')}</b>
                <Button href="/rss.xml" tone="quiet" size="sm" fullWidth={false}>{t('rssAction')}</Button>
              </div>
              <div className="flex items-center justify-between gap-3 py-[11px]">
                <b className="text-[14px]">{t('alert')}</b>
                <Button href="/inscription" tone="quiet" size="sm" fullWidth={false}>{t('alertAction')}</Button>
              </div>
              <p className="mt-2 mb-0 text-small leading-[1.5] text-ink-2">{t('noEmail')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Colonnes ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 grid grid-cols-1 stack:grid-cols-2 wide:grid-cols-4 gap-12">

          {/* Marque */}
          <div>
            <LocalizedLink to="/" className="inline-block mb-5">
              <Wordmark brand="hello" size={26} />
            </LocalizedLink>
            <p className="max-w-prose text-meta text-ink-2 leading-relaxed mb-6">
              {t('brandTagline')}
            </p>
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

          {/* Plateforme */}
          <div>{column('columns.platform', footerLinks.plateforme)}</div>

          {/* À propos, puis Légal */}
          <div>
            {column('columns.about', footerLinks.apropos)}
            <div className="mt-8">{column('columns.legal', footerLinks.legal)}</div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mm-eyebrow mb-5">{t('columns.contact')}</h3>
            <ul className="space-y-4 text-meta text-ink-2">
              <li className="flex items-start gap-3">
                <Icon name="mail" size={16} className="mt-0.5 shrink-0" strokeWidth={2.2} />
                <span>{contact.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="phone" size={16} className="mt-0.5 shrink-0" strokeWidth={2.2} />
                <span>{contact.phoneDisplay}</span>
              </li>
              <li className="flex items-start gap-3">
                <Icon name="pin" size={16} className="mt-0.5 shrink-0" strokeWidth={2.2} />
                <span>{contact.city}, {contact.country}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Mentions ────────────────────────────────────────────────────────── */}
        <div className="py-6 border-t border-[color:var(--border-hair)] flex flex-col stack:flex-row justify-between items-center gap-4">
          <p className="text-small text-ink-2">{t('copyright', { year: new Date().getFullYear() })}</p>
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
      </div>
    </footer>
  );
}
