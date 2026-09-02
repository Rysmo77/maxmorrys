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
        /* `ink-3` PORTE DÉSORMAIS DU TEXTE (AD-25). Il valait #98A1AE — 2,61:1 sur blanc,
           et « aucun voile ne le sauve », d'où l'interdiction d'AD-18. La livraison des
           tableaux de bord l'a remonté à #68727F, soit **4,88:1**, le symétrique exact de
           son homologue nuit (#77828F, 4,95:1). Les deux échelles étaient asymétriques au
           seul cran qui compte.
           ⚠️ Ce cran EST le plancher : ne jamais l'éclaircir. `ds:check` le vérifie. */
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
        /* ── 30/08 : `neutral` et `teal` · 01/09 : TOUTES LES AUTRES ─────────────
           Le raisonnement ci-dessus ne valait que pour deux échelles, alors qu'il vaut
           pour les vingt-deux : `bg-blue-500` rendait du bleu Tailwind, silencieusement,
           à côté d'un `bg-forme` qui rend le bleu de la marque et bascule sous `.dk`.

           Le dépôt n'en comptait plus qu'UNE seule occurrence réelle au moment de
           fermer la porte — l'aperçu SERP de `SEOPanel`, passée en valeur littérale
           parce qu'une marque tierce ne se recolore pas au jeton. Les autres
           correspondances d'une recherche naïve étaient des COMMENTAIRES qui
           documentaient des retraits déjà faits.

           `white`, `black`, `transparent`, `current` et `inherit` restent : ce ne sont
           pas des teintes concurrentes, et le dépôt s'en sert. */
        slate: undefined, gray: undefined, zinc: undefined, neutral: undefined, stone: undefined,
        red: undefined, orange: undefined, amber: undefined, yellow: undefined, lime: undefined,
        green: undefined, emerald: undefined, teal: undefined, cyan: undefined, sky: undefined,
        blue: undefined, indigo: undefined, violet: undefined, purple: undefined,
        fuchsia: undefined, pink: undefined, rose: undefined,

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

      /*
       * ⚠️ LES SUFFIXES QUE TAILWIND SE RÉSERVE NE PEUVENT PAS SERVIR DE NOM DE JETON.
       *
       * Depuis la 3.3, Tailwind génère des utilitaires DIRECTIONNELS de rayon :
       * `rounded-s` et `rounded-e` (logiques, start/end), `rounded-t/r/b/l`, et les
       * quatre coins `rounded-tl/tr/br/bl` — plus les logiques `ss/se/es/ee`.
       *
       * Nommer un jeton `s` produisait donc DEUX règles pour la même classe, et la
       * directionnelle, émise en second, gagnait :
       *
       *     .rounded-s { border-radius: var(--r-s) }              ← 10 px, 4 coins
       *     .rounded-s { border-start-start-radius: .25rem;
       *                  border-end-start-radius:   .25rem }      ← 4 px, 2 coins ✔ appliquée
       *
       * Seize classes du dépôt rendaient un rayon de 4 px sur DEUX coins au lieu des
       * 10 px du kit sur quatre — vérifié dans le CSS de production, pas déduit. Rien ne
       * le signalait : la classe existe, le typecheck passe, la build passe, `ds:check`
       * rendait 0 constat. C'est exactement le défaut que le bloc `neutral: undefined`
       * ci-dessus existe pour empêcher côté couleur, appliqué au mauvais espace de noms.
       *
       * D'où `xs` plutôt que `s`, et `card` plutôt que `l`. `m`, `xl`, `media` et `pill`
       * ne sont réservés par rien.
       *
       * `card` porte `--r-l`, le rayon que le kit destine aux « cartes et panneaux de
       * verre ». Le jeton n'est pas perdu, seulement renommé : sous la clé `l`, il
       * entrait en collision avec l'utilitaire de CÔTÉ GAUCHE, et cassait au passage
       * `rounded-l-xl` — un usage parfaitement légitime.
       *
       * `tests/unit/tailwind-radius-collision.test.ts` compile la configuration et
       * échoue si un jeton reprend un suffixe réservé. C'est la porte qui manquait.
       */
      borderRadius: {
        xs: t('r-s'),
        m: t('r-m'),
        card: t('r-l'),
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

      /*
       * ── LE SYSTÈME NE DÉCLARE QUE DEUX RUPTURES, ET MAINTENANT LUI SEUL EN A ──────
       *
       * `brand/breakpoints.css` — copie littérale du kit — n'écrit que deux media
       * queries : 700 px et 1080 px. Le dépôt en pratiquait pourtant QUATRE de plus,
       * celles de Tailwind : `sm` 640, `md` 768, `lg` 1024, `xl` 1280, sur 116 classes.
       *
       * Concrètement, deux règles de mise en page basculaient à 60 px d'écart sur la
       * même page : une grille passait à deux colonnes à 640 pendant que la carte
       * voisine attendait 700. La bande entre les deux n'a jamais été dessinée par
       * personne — et c'est justement la largeur qui compte le plus ici, la tablette
       * en portrait.
       *
       * Les 116 classes sont migrées vers la rupture la plus proche (`sm`/`md` →
       * `stack`, `lg`/`xl` → `wide`) — vérifié sans aucune collision. Et les quatre
       * échelles héritées sont ANNULÉES, comme les couleurs le sont plus haut : un
       * `sm:` oublié ne rend désormais RIEN, donc il se voit.
       */
      screens: {
        stack: '700px',
        wide: '1080px',
        sm: undefined, md: undefined, lg: undefined, xl: undefined, '2xl': undefined,
      },

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
