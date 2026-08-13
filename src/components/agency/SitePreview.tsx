import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone } from 'lucide-react';
import { universeThemes } from '../../lib/sectionThemes';

/**
 * Aperçu réel d'un site en production, avec bascule bureau / mobile.
 *
 * Extrait tel quel de la page À propos, où le mécanisme tourne déjà en production. Deux
 * adaptations seulement : l'accent passe au lagoon (univers agence) et les libellés viennent
 * du namespace `agency`.
 *
 * ⚠️ Les deux services de capture sont appelés directement en `<img src>`. La CSP de
 * `firebase.json` autorise `img-src 'self' https:` mais **pas** ces domaines en `connect-src` :
 * toute variante qui interrogerait Microlink en JSON serait bloquée. Conserver
 * `embed=screenshot.url`, qui fait répondre l'API par l'image elle-même.
 *
 * ⚠️ `group-hover:` sur les ombres : suppose une classe `group` sur la carte parente.
 */

/** Capture desktop — WordPress mShots (gratuit, illimité, cache CDN). */
const desktopShotUrl = (url: string) =>
  `https://s.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=820`;

/** Capture mobile réelle — Microlink émule un vrai viewport mobile.
 *  `embed=screenshot.url` → l'API renvoie directement l'image (utilisable en <img src>). */
const mobileShotUrl = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}` +
  `&screenshot=true&meta=false&embed=screenshot.url` +
  `&viewport.isMobile=true&viewport.width=400&viewport.height=860`;

const theme = universeThemes.agency;

interface SitePreviewProps {
  /** URL complète du site à capturer. */
  url: string;
  /** Domaine affiché dans la barre du mockup navigateur. */
  domain: string;
  /** Nom du produit — alimente les libellés accessibles. */
  name: string;
}

export default function SitePreview({ url, domain, name }: SitePreviewProps) {
  const { t } = useTranslation('agency');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const switchTo = (d: 'desktop' | 'mobile') => {
    if (d === device) return;
    setLoaded(false);
    setFailed(false);
    setDevice(d);
  };

  const src = device === 'desktop' ? desktopShotUrl(url) : mobileShotUrl(url);

  /** Capture + skeleton + repli — partagés entre les 2 mockups. */
  const screenshot = (
    <>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
      )}
      {failed ? (
        // Repli : le domaine, plutôt qu'une image cassée.
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <span className="text-lg font-black text-neutral-400/70 dark:text-neutral-600 tracking-tight px-3 text-center">{domain}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={device === 'mobile' ? t('preview.mobileAlt', { name }) : t('preview.desktopAlt', { name })}
          loading="lazy"
          width={device === 'mobile' ? 400 : 1280}
          height={device === 'mobile' ? 860 : 800}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover object-top transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </>
  );

  const toggleBtn = (d: 'desktop' | 'mobile', Icon: typeof Monitor, label: string) => (
    <button
      type="button"
      onClick={() => switchTo(d)}
      aria-pressed={device === d}
      aria-label={t('preview.deviceAria', { label })}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        device === d
          ? theme.buttonSolid
          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
    </button>
  );

  return (
    <div>
      {/* Interrupteur bureau / mobile */}
      <div className="flex justify-end mb-3">
        <div
          role="group"
          aria-label={t('preview.groupAria', { name })}
          className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700"
        >
          {toggleBtn('desktop', Monitor, t('preview.desktopLabel'))}
          {toggleBtn('mobile', Smartphone, t('preview.mobileLabel'))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {device === 'desktop' ? (
          <motion.div
            key="desktop"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-lg shadow-neutral-900/5 dark:shadow-black/30 overflow-hidden transition-shadow duration-300 group-hover:shadow-xl"
          >
            {/* Chrome navigateur */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200/80 dark:border-neutral-700">
              <span className="flex gap-1.5 shrink-0" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="flex-1 truncate text-center text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 rounded-md px-3 py-1 mx-2">
                {domain}
              </span>
              <span className="w-9 shrink-0" aria-hidden="true" />
            </div>
            {/* Corps de fenêtre — capture bureau */}
            <div className="aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative">
              {screenshot}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex justify-center py-2"
          >
            {/* Mockup téléphone */}
            <div className="relative w-[240px] max-w-full rounded-[2.2rem] bg-neutral-900 dark:bg-neutral-800 p-2.5 shadow-xl shadow-neutral-900/20 dark:shadow-black/40 transition-shadow duration-300 group-hover:shadow-2xl">
              {/* Encoche */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1/3 h-5 bg-neutral-900 dark:bg-neutral-800 rounded-b-2xl z-10" />
              {/* Écran — capture mobile */}
              <div className="aspect-[9/19.5] rounded-[1.6rem] overflow-hidden bg-neutral-50 dark:bg-neutral-900 relative">
                {screenshot}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
