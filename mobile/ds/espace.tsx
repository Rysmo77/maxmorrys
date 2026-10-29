import { createContext, useContext, type ReactNode } from 'react';
import { useActionGradient } from './Gradient';
import { useScheme, useToken, veil } from './theme';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'ESPACE D'UN ÉCRAN — `data-space` du kit v4.5, transposé.
 *
 * Le kit natif ne teinte plus un écran par son « territoire » (les quatre verbes du site) mais
 * par l'ESPACE où l'on se trouve : `hub` (accueil, profil), `edu` (apprendre), `club`, `ia`
 * (l'assistant) et `admin` (la console). Chaque espace pose UNE teinte d'action (`--rv`), sa
 * variante d'encre (`--rv-2`), son fond doux (`--rv-soft`, l'indicateur Material 3) et son
 * dégradé de bouton (`--rv-grad`).
 *
 * Toutes ces valeurs sont DÉRIVÉES des jetons — aucune teinte n'est recopiée du kit : le kit
 * écrit `#e1edff` ou `#002a5c`, qui ne basculeraient pas en sombre. Le fond doux est un voile
 * de la teinte, l'encre posée dessus est la teinte « texte » du jeton.
 *
 * `Screen` ouvre la portée ; tout composant du DS qui doit prendre la couleur de l'espace
 * (retour iOS, bouton principal, pastille d'onglet, puce active Android, icône de rangée) la
 * LIT ici, et aucun écran n'a à la passer.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export type Espace = 'hub' | 'edu' | 'club' | 'ia' | 'admin';

const Portee = createContext<Espace>('hub');

export function EspaceScope({ espace, children }: { espace: Espace; children: ReactNode }) {
  return <Portee.Provider value={espace}>{children}</Portee.Provider>;
}

export function useEspaceCourant(): Espace {
  return useContext(Portee);
}

export type Teinte = {
  /** La teinte d'action : retour iOS, onglet actif, interrupteur, icône de rangée. */
  rv: string;
  /** L'encre de la teinte, lisible en petit — en-têtes de rubrique Android, liens. */
  rv2: string;
  /** Le fond doux — indicateur d'onglet Material 3, puce active, icône ronde Android. */
  doux: string;
  /** L'encre posée sur le fond doux. */
  surDoux: string;
  /** Le dégradé du bouton principal. Une seule teinte = aplat. */
  degrade: readonly string[];
};

/** La teinte d'un espace donné — pour la barre d'onglets, qui vit HORS de toute portée d'écran. */
export function useTeinteDe(espace: Espace): Teinte {
  const t = useToken();
  const g = useActionGradient();
  const sombre = useScheme() === 'dark';
  switch (espace) {
    case 'edu':
      return {
        rv: t('mmBleu'),
        rv2: sombre ? t('mmBleu') : t('mmBleuF'),
        doux: veil(t('mmBleu'), sombre ? 0.22 : 0.12),
        surDoux: sombre ? t('mmBleuN') : t('mmBleuF'),
        degrade: g.forme,
      };
    case 'club':
    case 'ia':
      return {
        rv: t('mmViolet'),
        rv2: t('mmVioletT'),
        doux: veil(t('mmViolet'), sombre ? 0.24 : 0.12),
        surDoux: sombre ? t('mmVioletN') : t('mmVioletT'),
        degrade: g.transforme,
      };
    default:
      /* hub et admin : l'encre. Le kit l'écrit `#0e1116 → #2b3140` ; ici l'aplat de l'action
         principale, qui bascule avec le mode — un bouton noir sur fond nuit ne se verrait pas. */
      return {
        rv: t('ink'),
        rv2: t('mmVioletT'),
        doux: t('fill2'),
        surDoux: t('ink'),
        degrade: [t('actionPrimary')],
      };
  }
}

/** La teinte de l'espace ouvert par l'écran courant. */
export function useTeinte(): Teinte {
  return useTeinteDe(useEspaceCourant());
}
