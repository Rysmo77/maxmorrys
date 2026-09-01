/**
 * Tailwind LIT les jetons du design system — il ne les redéfinit jamais.  (AD-2)
 *
 * Le piège que cette configuration existe pour fermer : deux palettes concurrentes. Le dépôt
 * portait 47 échelles maison (`brand-*`, `accent-*`, `plum-*`, `morrys-*`, `lagoon-*`,
 * `coral-*`, `teal-*`) et 1 979 occurrences déjà posées ; le design system en apporte quatre
 * teintes et leurs variantes nuit. Deux sources de couleur dans un même dépôt, c'est un
 * arbitrage rendu au hasard, écran par écran, par qui écrit la ligne.
 *
 * Donc : toute couleur pointe ici sur une variable CSS, et les variables vivent dans
 * `src/design-system/css/tokens/`, copies littérales du kit. Le mode sombre bascule seul, par
 * la portée `.dk`, sans qu'aucune classe `dark:` de couleur ne soit nécessaire (AD-3).
 *
 * ✅ 30/08/2026 — la passe de migration est terminée : les 47 échelles héritées ont été
 * retirées de ce fichier, et le dépôt ne compte plus une seule occurrence des noms `brand-*`,
 * `accent-*`, `plum-*`, `morrys-*`, `lagoon-*`, `coral-*`, `teal-*`, `success-*`, `warning-*`,
 * `error-*` ni `neutral-*`. À partir d'ici, écrire l'une de ces classes ne produit RIEN — ce qui
 * est le but : un oubli se voit à l'écran au lieu de rendre une couleur de l'ancienne palette.
 *
 * ⚠️ Tailwind 3.4.1 — configuration JS. PAS la syntaxe v4 (`@theme` en CSS).
 */

/** Un jeton, tel que Tailwind doit le lire. */
const t = (name) => `var(--${name})`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  // Le thème est une PORTÉE CSS, pas une classe utilitaire (AD-3). `.dk` est posée sur <html>.
  // Le variant `dark:` reste disponible pour la MISE EN PAGE ; il ne porte plus de couleur.
  darkMode: ['selector', '.dk'],

  theme: {
    extend: {
      colors: {
        // ── Les quatre territoires. Chaque teinte bascule seule sous `.dk`. ──────────
        forme: t('mm-bleu'),
        informe: t('mm-orange'),
        transforme: t('mm-violet'),
        digitalise: t('mm-teal'),
        corail: t('mm-corail'),
        // L'agence porte du texte en corail (barre haute). #FF6E7F fait 2,70:1 sur blanc :
        // c'est cette variante-ci qui s'écrit, jamais la teinte pleine. Voir AD-20.
        'corail-txt': t('mm-corail-t'),

        // Versions TEXTE des teintes interdites sur blanc. L'orange fait 2,47:1 et le teal
        // 2,84:1 : ni l'un ni l'autre ne porte du texte. Sous `.dk`, ces alias pointent
        // d'eux-mêmes sur la variante nuit.
        'informe-txt': t('mm-orange-t'),
        'digitalise-txt': t('mm-teal-t'),
        'transforme-txt': t('mm-violet-t'),

        // ── Encre et papier ──────────────────────────────────────────────────────────
        ink: t('ink'),
        'ink-2': t('ink-2'),
        // `ink-3` NE PORTE PAS DE TEXTE (AD-18) : 2,61:1 sur blanc pur, et aucun voile ne le
        // sauve. Il reste exposé pour les filets, les puits d'icônes et l'état désactivé.
        'ink-3': t('ink-3'),
        paper: t('paper'),
        'paper-2': t('paper-2'),
        'paper-3': t('paper-3'),
        line: t('line'),
        night: t('night'),
        'night-2': t('night-2'),
        'night-3': t('night-3'),

        /* ── Les deux échelles héritées que Tailwind livre LUI-MÊME ─────────────────
           `brand`, `accent`, `plum`, `morrys`, `lagoon`, `coral`, `success`, `warning` et
           `error` ont disparu avec le bloc hérité : ces noms n'existent nulle part ailleurs, et
           toute occurrence oubliée est désormais une classe inexistante — visible.

           `neutral` et `teal`, eux, sont DANS LA PALETTE PAR DÉFAUT de Tailwind. Les retirer
           de `extend` ne les retire de rien : un `bg-neutral-<n>` oublié continuerait de rendre du gris,
           et l'oubli resterait silencieux — exactement ce que la suppression du bloc hérité
           devait rendre impossible (AD-2). On les annule donc explicitement. `white`, `black`,
           `transparent`, `current` et le reste de la palette par défaut sont intacts.
           ────────────────────────────────────────────────────────────────────────────── */
        neutral: undefined,
        teal: undefined,

        // ── États ────────────────────────────────────────────────────────────────────
        ok: t('ok'),
        warn: t('warn'),
        stop: t('stop'),

        // ── Surfaces ─────────────────────────────────────────────────────────────────
        surface: {
          page: t('surface-page'),
          card: t('surface-card'),
          flat: t('surface-card-flat'),
          hero: t('surface-hero'),
          night: t('surface-night'),
          /* AD-22 — la surface OPAQUE qui bascule seule. `bg-paper` ne bascule pas : c'est le
             blanc de référence, et sous `.dk` il donne 1,06:1 avec l'encre. */
          sheet: t('surface-sheet'),
          quiet: t('surface-quiet'),
        },
      },

      // Trois familles, trois rôles. Le monospace n'est PAS une option de style : il déclare
      // qu'un nombre vient de la base ou d'une source citée (AD-5, règle 6).
      fontFamily: {
        display: [t('f-display')],
        sans: [t('f-body')],
        mono: [t('f-mono')],
      },

      // L'échelle du kit, verbatim. Fraunces 900 ne descend jamais sous 22 px.
      fontSize: {
        'dsp-xxl': [t('fs-dsp-xxl'), { lineHeight: t('lh-dsp-xxl'), letterSpacing: t('ls-dsp-xxl'), fontWeight: '900' }],
        'dsp-xl': [t('fs-dsp-xl'), { lineHeight: t('lh-dsp-xl'), letterSpacing: t('ls-dsp-xl'), fontWeight: '900' }],
        dsp: [t('fs-dsp'), { lineHeight: t('lh-dsp'), letterSpacing: t('ls-dsp'), fontWeight: '900' }],
        'dsp-sm': [t('fs-dsp-sm'), { lineHeight: t('lh-dsp-sm'), letterSpacing: t('ls-dsp-sm'), fontWeight: '900' }],
        'dsp-xs': [t('fs-dsp-xs'), { lineHeight: t('lh-dsp-xs'), letterSpacing: t('ls-dsp-xs'), fontWeight: '900' }],
        ttl: [t('fs-ttl'), { letterSpacing: t('ls-ttl'), fontWeight: '900' }],
        body: [t('fs-body'), { lineHeight: t('lh-body') }],
        lede: [t('fs-lede'), { lineHeight: t('lh-lede') }],
        prose: [t('fs-prose'), { lineHeight: t('lh-prose') }],
        meta: [t('fs-meta')],
        'meta-2': [t('fs-meta-2')],
        small: [t('fs-small')],
        eyebrow: [t('fs-eyebrow'), { letterSpacing: t('ls-eyebrow') }],
      },

      /*
       * L'ÉCHELLE D'ESPACEMENT DU KIT N'ENTRE PAS DANS L'ESPACE DE NOMS DE TAILWIND.
       *
       * La tentation était d'écrire `spacing: { 4: 'var(--sp-4)', 8: 'var(--sp-8)', … }`.
       * Elle produit un défaut qu'aucune porte automatique ne voit : Tailwind compte en rem
       * (`p-4` = 1rem = 16 px), le kit compte en pixels (`--sp-4` = 4 px). La clé `4` est la
       * même, la valeur est DIVISÉE PAR QUATRE — sur 3 498 classes d'espacement du dépôt.
       * Le typecheck passe, la build passe, le vérificateur des six règles passe. Seul l'œil
       * voit, et seulement sur un écran déjà rendu.
       *
       * Les valeurs du kit servent là où le kit les écrit : dans les primitives du design
       * system, en style calculé, qui lisent `var(--sp-N)` directement. Les surfaces, elles,
       * continuent de compter en rem — c'est ce sur quoi elles sont bâties, et rien
       * n'oblige les deux échelles à partager un espace de noms.
       */

      // Espacements que le kit pratique et que Tailwind n'a pas — nommés, jamais numérotés.
      spacing: {
        gutter: t('gutter-screen'),
        pane: t('gutter-pane'),
        panel: t('pad-panel'),
        tabbar: t('tabbar-h'),
        touch: t('touch-aa'),
      },

      borderRadius: {
        s: t('r-s'),
        m: t('r-m'),
        l: t('r-l'),
        xl: t('r-xl'),
        media: t('r-media'),
        pill: t('r-pill'),
      },

      // Quatre durées, deux courbes, et rien d'autre (AD-16).
      transitionDuration: { tap: t('t-tap'), ui: t('t-ui'), enter: t('t-enter'), scene: t('t-scene') },
      transitionTimingFunction: { ds: t('ease'), 'ds-out': t('ease-out') },

      // La seule règle de mise en page que le design system déclare non négociable (AD-14) :
      // la colonne de lecture ne s'élargit jamais, à 1400 px comme à 390.
      maxWidth: { prose: t('measure-prose'), doc: t('measure-doc') },

      screens: { stack: '700px', wide: '1080px' },

      boxShadow: {
        glass: t('glass-sh'),
        'glass-hero': t('glass-sh-hero'),
        'glass-flat': t('glass-sh-flat'),
        forme: t('sh-bleu'),
        transforme: t('sh-violet'),
        digitalise: t('sh-teal'),
        ink: t('sh-ink'),
        card: t('card-sh'),
        // Reprise de l'ancienne `shadow-soft` (12 usages) : l'ombre plate du système en est
        // la jumelle — même famille douce et large, même opacité d'encre.
        soft: t('glass-sh-flat'),
      },
    },
  },

  plugins: [require('@tailwindcss/typography')],
};
