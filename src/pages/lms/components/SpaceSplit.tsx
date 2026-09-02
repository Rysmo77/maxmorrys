import type { ReactNode } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA TROISIÈME COLONNE DE L'ESPACE APPRENANT — écrite UNE fois pour les cinq écrans.
 *
 * `handoff_tableaux_de_bord/dashboards.jsx` § AppFrame : navigation 250 · travail
 * fluide · panneau 340. `AppShell` pose déjà la première ; les écrans n'ajoutent
 * que la troisième.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA COLONNE DE TRAVAIL NE S'ÉTIRE PAS, ET C'EST LA RÈGLE QUI COMPTE ICI.
 *
 * « L'espace gagné va à la marge et à la navigation, jamais à la longueur de
 * ligne » (README du handoff). Les cinq pages ajoutent donc une COLONNE ; elles
 * n'étirent aucun bloc de texte. D'où `wide:max-w-[46rem]` sur la colonne de
 * travail : `max-w-4xl` saute en desktop pour laisser la grille prendre la
 * largeur, mais le texte garde sa propre borne.
 *
 * SANS `aside`, PAS DE COLONNE. « Une page sans panneau n'affiche pas un panneau
 * vide — la colonne de travail prend la place. C'est ce qui distingue une
 * disposition à trois colonnes d'une disposition à deux colonnes qui aurait été
 * étirée. » `ProfilDesktop` est exactement ce cas : deux colonnes de travail, aucun
 * panneau de contexte.
 *
 * ⚠️ UN PANNEAU QUI COÛTE UN APPEL RÉSEAU NE SE CACHE PAS EN CSS. `TutorPanel`
 * relève le quota à son montage : `hidden` l'aurait monté quand même sur téléphone,
 * et l'appel serait parti, invisible. Ces panneaux-là se montent par
 * `useMediaQuery('(min-width: 1080px)')` du côté de l'appelant, pas ici. Ce
 * composant ne gère que la mise en page.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export interface SpaceSplitProps {
  /** Le panneau de contexte. Absent = pas de troisième colonne, et pas de vide. */
  aside?: ReactNode;
  /** Nom accessible de la région — « Reprendre où tu en étais ». */
  asideLabel?: string;
  children: ReactNode;
}

export default function SpaceSplit({ aside, asideLabel, children }: SpaceSplitProps) {
  if (!aside) return <>{children}</>;
  return (
    <div className="wide:grid wide:grid-cols-[minmax(0,1fr)_340px] wide:items-start wide:gap-6">
      <div className="min-w-0 wide:max-w-[46rem]">{children}</div>
      <aside
        aria-label={asideLabel}
        className="mt-5 wide:sticky wide:top-2 wide:mt-0 wide:max-h-[calc(100vh-5rem)] wide:overflow-y-auto"
      >
        {aside}
      </aside>
    </div>
  );
}
