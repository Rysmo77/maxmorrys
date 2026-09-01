import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassPanel, Pipeline } from '@ds';
import { SiteEyebrow } from '../site';

/**
 * ── LES DEUX SEULES RUPTURES DU SYSTÈME : 700 ET 1080 ───────────────────────────────
 *
 * Le kit responsive n'en déclare que deux (`ui_kits/responsive/index.html:36-38`), et
 * `tailwind.config.js` les expose sous les noms `stack:` et `wide:` — les jetons de
 * `brand/breakpoints.css` étant, eux, une copie littérale.
 *
 * Les dix-neuf écrans de console comptaient pourtant **cinquante et une** classes en `stack:`
 * (640 px), `wide:` (1024) et `wide:` (1280) : trois ruptures que le système ne connaît pas, et
 * aucune des deux qu'il déclare. Concrètement, les grilles de cases de relevé passaient à deux
 * colonnes soixante pixels trop tôt et à quatre deux cents pixels trop tard — sur la seule
 * largeur qui compte vraiment ici, la tablette en portrait.
 *
 * Le défaut est de la même famille que le maillage figé ou le repli sans thème : il rend
 * correctement sur l'écran de qui l'écrit. Il ne se manifeste que sur une largeur qu'on n'a
 * pas ouverte.
 */
export interface ConsolePageProps {
  /**
   * Ce que l'écran administre.
   *
   * IL N'EST PAS RENDU EN TITRE VISIBLE, et c'est une correction. `AppShell` affiche déjà ce
   * même titre dans sa barre haute, en `<h1>`, alimenté par la table `ADMIN_TITLES` que
   * `AdminLayout` construit depuis la navigation — donc pour chaque route sans exception.
   * En rendre un second ici donnait DEUX `<h1>` par écran, sur les dix-neuf, et le même mot
   * écrit deux fois à quinze centimètres d'intervalle.
   *
   * Le kit dessine bien un titre dans le corps de `ConsoleScreen` : sa planche n'a pas
   * d'en-tête d'application. Le nôtre en a un, et c'est lui qui porte le titre du kit.
   *
   * La valeur sert ici de nom accessible à la région : un lecteur d'écran annonce « région
   * Transactions » en y entrant, ce que la barre haute seule ne donnait pas.
   */
  title: string;
  /** Le sous-titre du kit — « Console · pilotage », « Console · contenu ». */
  sub?: string;
  children: ReactNode;
  /** Pour poser `.rv` et son `--i` : c'est l'appelant qui connaît le rang d'entrée. */
  className?: string;
  style?: CSSProperties;
}

/**
 * ── LE MOTIF DE CONSOLE, ÉCRIT UNE FOIS POUR DIX-NEUF ÉCRANS ────────────────────────
 *
 * `ui_kits/console/ScreensMotif.js` ne livre que cinq instances sur dix-neuf, et il dit
 * pourquoi : « le motif ne dit rien du contenu de chaque écran ; il fixe l'ordre des zones
 * et la règle d'une action par ligne. Les dix-neuf écrans s'y conforment sans exception. »
 * Les quatorze autres sont fournis comme pipelines de statuts seulement — c'est-à-dire
 * comme des DONNÉES à passer à ce composant, pas comme des dessins à recopier.
 *
 * TROIS ZONES, TOUJOURS DANS CET ORDRE :
 *
 *   1. `ConsoleFilter` — filtre par STATUT, jamais par date. « Un opérateur unique cherche
 *      ce qui attend, pas ce qui s'est passé mardi. » C'est pourquoi ce composant n'expose
 *      aucun sélecteur de période : l'absence est la décision.
 *   2. `ConsoleList` — liste dense, un état et UNE action par ligne. « Deux actions par
 *      ligne, c'est une hésitation par ligne. » `ConsoleList` ne l'impose pas au type — un
 *      `trailing` accepte n'importe quel nœud — mais la revue le vérifie, et ce commentaire
 *      est l'endroit où la règle est écrite.
 *   3. `ConsoleScope` — ce que l'écran NE couvre PAS. « Le non-dit d'un écran
 *      d'administration finit toujours en manœuvre manuelle non tracée. »
 *
 * La console vit en nuit : `AdminLayout` pose déjà `.dk` en portée CSS via `AppShell`.
 * Aucune couleur n'est donc écrite ici — les 78 jetons qui basculent le font tout seuls.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
export default function ConsolePage({ title, sub, children, className, style }: ConsolePageProps) {
  return (
    /*
      `.play` EST POSÉ ICI, EN DUR, ET C'EST LA SEULE FAÇON QUE ÇA MARCHE.
      `.rv` vaut `opacity: 0` tant qu'un ancêtre ne porte pas `.play` — et rien, dans
      `AppShell` ni dans `AdminLayout`, ne le posait. Le pied `ConsoleScope`, qui est la
      troisième zone OBLIGATOIRE du motif, était donc invisible sur les dix-neuf écrans.

      Pourquoi pas `useReveal`, comme sur le site : son observateur déclenche à 12 % de
      visibilité, et un écran d'administration fait souvent plus de huit hauteurs de fenêtre.
      Le seuil n'est jamais atteint pour un bloc de pied, qui resterait à zéro. Une console
      n'a de toute façon pas de scène d'entrée à jouer : elle s'ouvre, elle est là.
    */
    <section
      aria-label={title}
      className={className ? `play ${className}` : 'play'}
      style={style}
    >
      {sub && <SiteEyebrow style={{ marginBottom: '18px' }}>{sub}</SiteEyebrow>}
      {children}
    </section>
  );
}

export interface ConsoleFilterProps {
  /** Les statuts du pipeline. Le premier est « tout » par convention du kit. */
  stages: string[];
  active?: string;
  onSelect?: (stage: string) => void;
  /** Ce que le pipeline filtre — « Statut des prospects ». Lu par les lecteurs d'écran. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

/** Zone 1 — le filtre par statut. */
export function ConsoleFilter({ stages, active, onSelect, label, className, style }: ConsoleFilterProps) {
  return (
    <Pipeline
      stages={stages}
      active={active}
      onSelect={onSelect}
      label={label}
      className={className}
      style={style}
    />
  );
}

export interface ConsoleListProps {
  /** Nom de la liste, pour les lecteurs d'écran. */
  label?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Zone 2 — la liste dense. Le kit l'enveloppe dans un `GlassPanel level="night"` au
 * rembourrage `4px 18px` : les lignes portent leur propre respiration verticale, le
 * panneau ne fait que les cadrer.
 */
export function ConsoleList({ label, children, className, style }: ConsoleListProps) {
  return (
    <GlassPanel level="night" padding="4px 18px" className={className} style={style}>
      <ul className="m-0 list-none p-0" aria-label={label}>
        {children}
      </ul>
    </GlassPanel>
  );
}

export interface ConsoleScopeProps {
  /**
   * L'intitulé du pied. Traduit par défaut depuis `admin.motif.scopeTitle` — la console
   * est bilingue comme le reste (elle a son propre espace de noms `admin.json`), et figer
   * « Ce que cet écran ne couvre pas » en français laisserait un îlot non traduit au
   * milieu de dix-neuf écrans qui le sont.
   */
  title?: string;
  children: ReactNode;
  /** Rang d'entrée dans la scène. Le kit le pose à 9 : le pied entre en dernier. */
  order?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Zone 3 — le pied qui nomme les angles morts.
 *
 * Ce n'est pas une note de bas de page décorative. Le kit en fait la troisième zone
 * OBLIGATOIRE du motif, et son texte est toujours écrit à la main pour l'écran concerné :
 * une formule générique — « d'autres fonctions arrivent » — ne dit rien et ne prévient
 * personne. Un écran sans pied est un écran non conforme.
 */
export function ConsoleScope({ title, children, order = 9, className, style }: ConsoleScopeProps) {
  const { t } = useTranslation('admin');
  return (
    <GlassPanel
      level="night"
      padding={16}
      className={className ? `rv mt-5 ${className}` : 'rv mt-5'}
      style={{ ['--i' as string]: order, ...style }}
    >
      <SiteEyebrow style={{ marginBottom: '6px' }}>{title ?? t('motif.scopeTitle')}</SiteEyebrow>
      <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{children}</p>
    </GlassPanel>
  );
}
