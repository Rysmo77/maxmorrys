import type { ReactNode } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA TROISIÈME COLONNE DE LA CONSOLE — écrite UNE fois pour les dix-neuf écrans.
 *
 * `handoff_tableaux_de_bord/dashboards.jsx` § ConsoleFrame compose la console en
 * 1440 : navigation 230 · liste dense fluide · détail 380. La première colonne
 * existe déjà — `AppShell` la pose et décale de 250 px. Les écrans n'ajoutent donc
 * que la troisième, et c'est ce composant qui la porte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS DÉCISIONS, TOUTES REPRISES DU HANDOFF
 *
 * · `wide:` (1080 px) ET RIEN D'AUTRE. C'est la seule rupture que le système
 *   déclare au-dessus de la tablette (`tailwind.config.js` : stack 700, wide 1080).
 *   `useIsDesktop()` vaut 1024 : le prendre ouvrirait une bande de 56 px où la
 *   colonne existe sans son panneau. En dessous de 1080, la grille ne s'arme pas et
 *   le détail redevient un bloc empilé sous la liste — le téléphone garde
 *   exactement l'écran qu'il avait.
 *
 * · LE PANNEAU EST COLLANT, JAMAIS FIXE. « La file reste visible pendant qu'on
 *   traite » suppose qu'on défile la liste sans perdre le détail ; et l'inverse,
 *   qu'un détail plus haut que la fenêtre reste lisible — d'où son propre
 *   défilement. Une modale ferait exactement le contraire des deux.
 *
 * · SANS `detail`, IL N'Y A PAS DE COLONNE. Le README du handoff : « le panneau de
 *   droite est optionnel : sans contenu réel à y mettre, la colonne de travail prend
 *   la place plutôt que d'afficher un panneau vide ». Le composant rend alors ses
 *   enfants nus, sans même une `<div>` — pour que la grille ne laisse aucune trace.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export interface ConsoleSplitProps {
  /**
   * Le panneau de détail. `null` ou `undefined` = pas de troisième colonne.
   *
   * Un panneau qui n'a rien à montrer doit rendre son propre état vide (« aucune
   * ligne sélectionnée »), PAS renvoyer `null` : la colonne disparaîtrait sous le
   * doigt de l'opérateur au moment où il désélectionne.
   *
   * ⚠️ IL Y A UNE SECONDE RAISON LÉGITIME DE PASSER `null`, ET ELLE N'EST PAS CELLE-LÀ.
   * Quatre écrans — transactions, comptes, formations, messages — ne montent leur
   * panneau qu'au-delà de 1080 px, par `useMediaQuery`. Le motif est le même que celui
   * de `TutorPanel` : sous cette largeur le panneau s'empilerait SOUS la file, donc la
   * seule action de l'écran partirait hors de vue au moment où on la demande. Ces
   * écrans gardent alors leur geste d'avant — la fiche s'ouvre en dialogue, ou l'action
   * revient sur la ligne. Passer `null` par rupture est délibéré ; passer `null` parce
   * que rien n'est sélectionné ne l'est jamais.
   */
  detail?: ReactNode;
  /** Nom accessible de la région de détail — « Prospect sélectionné ». */
  detailLabel?: string;
  children: ReactNode;
}

export default function ConsoleSplit({ detail, detailLabel, children }: ConsoleSplitProps) {
  if (!detail) return <>{children}</>;
  return (
    <div className="wide:grid wide:grid-cols-[minmax(0,1fr)_380px] wide:items-start wide:gap-5">
      <div className="min-w-0">{children}</div>
      <aside
        aria-label={detailLabel}
        className="mt-4 wide:sticky wide:top-2 wide:mt-0 wide:max-h-[calc(100vh-5rem)] wide:overflow-y-auto"
      >
        {detail}
      </aside>
    </div>
  );
}
