import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Aperçu du site d'une réalisation, en maquette de navigateur.
 *
 * ⚠️ UN SEUL APPAREIL, ET C'EST UNE DÉCISION. Une bascule bureau / mobile transforme l'aperçu
 * en objet qu'on manipule : elle avait du sens sur un index où l'aperçu ÉTAIT la page. Sur une
 * fiche, l'aperçu illustre — le vrai geste est le lien qui ouvre le site, et il est à côté.
 * Chaque commande ajoutée ici lui prend de l'attention sans rien donner de plus à voir.
 *
 * ⚠️ LE SERVICE DE CAPTURE EST APPELÉ DIRECTEMENT EN `<img src>`, et il faut que ça le reste.
 * La CSP de `firebase.json` autorise `img-src 'self' https:` mais **pas** ce domaine en
 * `connect-src` : toute variante qui interrogerait une API en JSON serait bloquée en
 * production — et seulement en production, puisqu'il n'y a aucune CSP en développement.
 */

/** Capture bureau — WordPress mShots (gratuit, illimité, cache CDN). */
const desktopShotUrl = (url: string) =>
  `https://s.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=820`;

interface RealisationPreviewProps {
  /** URL complète du site à capturer. */
  url: string;
  /** Domaine affiché dans la barre du mockup navigateur. */
  domain: string;
  /** Nom du produit — alimente les libellés accessibles. */
  name: string;
}

export default function RealisationPreview({ url, domain, name }: RealisationPreviewProps) {
  const { t } = useTranslation('realisations');
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <figure
      className="m-0 overflow-hidden rounded-card border border-[color-mix(in_srgb,var(--line)_80%,transparent)] bg-[color:var(--fill-2)] shadow-card"
      aria-label={t('fiche.previewChromeAria', { name })}
    >
      {/* Chrome navigateur — décoratif : il dit « ceci est un site », rien de plus. */}
      <div className="flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--line)_80%,transparent)] px-4 py-2.5">
        <span className="flex shrink-0 gap-1.5" aria-hidden="true">
          {/* Trois pastilles en jetons de remplissage, pas en couleurs macOS : une maquette
              n'a pas besoin d'imiter un système d'exploitation, et un hexadécimal écrit dans
              un composant ne bascule pas sous `.dk` (AD-2). */}
          <span className="h-2.5 w-2.5 rounded-pill bg-[color:var(--fill-4)]" />
          <span className="h-2.5 w-2.5 rounded-pill bg-[color:var(--fill-4)]" />
          <span className="h-2.5 w-2.5 rounded-pill bg-[color:var(--fill-4)]" />
        </span>
        <span className="mx-2 flex-1 truncate rounded-m bg-surface-sheet px-3 py-1 text-center text-[11px] font-semibold text-ink-2">
          {domain}
        </span>
        <span className="w-9 shrink-0" aria-hidden="true" />
      </div>

      <div className="relative aspect-[16/10] bg-[color:var(--fill-1)]">
        {!loaded && !failed && (
          /* Un squelette À LA FORME de l'image attendue : rien ne saute quand elle arrive.
             Jamais un rond qui tourne — il ne dit ni quoi, ni combien de temps. */
          <div className="absolute inset-0 animate-pulse bg-[color:var(--fill-2)]" aria-hidden="true" />
        )}
        {failed ? (
          /* Repli : le domaine, plutôt qu'une image cassée. Le service de capture peut
             répondre en différé sur une adresse qu'il n'a jamais vue. */
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--fill-2)] px-3">
            <span className="text-center font-display text-[18px] font-black tracking-[-.03em] text-ink-2">
              {domain}
            </span>
          </div>
        ) : (
          <img
            src={desktopShotUrl(url)}
            alt={t('fiche.previewAlt', { name })}
            loading="lazy"
            decoding="async"
            width={1280}
            height={800}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover object-top transition-opacity duration-scene ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
    </figure>
  );
}
