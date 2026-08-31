import { useCallback, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LE PONT ENTRE LES PRIMITIVES DE NAVIGATION ET LE ROUTEUR.
 *
 * Les primitives du design system rendent de VRAIS `<a href>` — c'est le point ouvert C du
 * transfert, et AD-6 en fait une règle : « toute cible de navigation rend un `<a href>` ou un
 * `<button>` ». Un onglet est une adresse : il se copie, s'ouvre dans un nouvel onglet, se
 * partage, s'annonce comme un lien, et porte `aria-current="page"`.
 *
 * Mais un `<a href>` nu RECHARGE la page, et ce dépôt est une application à routeur de
 * données. Les deux exigences ne sont pas contradictoires : elles se réconcilient au niveau
 * du CONTENEUR, pas du lien. Ce composant écoute le clic qui remonte, reconnaît un lien
 * interne, et le confie au routeur.
 *
 * Ce que ça préserve, et qu'une prop `onSelect` aurait perdu :
 *   · clic milieu, ⌘-clic, ctrl-clic ouvrent bien un nouvel onglet — on ne les intercepte pas ;
 *   · la barre d'état du navigateur affiche la destination au survol ;
 *   · Entrée au clavier fonctionne, parce qu'elle DÉCLENCHE un clic qui remonte ici ;
 *   · un lien externe, un `target`, un `download` gardent leur comportement natif.
 *
 * L'ancre pure (`#contenu`) n'est pas interceptée : c'est le lien de saut, et le routeur
 * n'a rien à en faire.
 */
export interface DsNavHostProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function DsNavHost({ children, className, style }: DsNavHostProps) {
  const navigate = useNavigate();

  const onClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.defaultPrevented) return;
      // Bouton secondaire ou modificateur : c'est une intention d'ouvrir ailleurs.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Ancre interne à la page courante — le lien de saut, un sommaire : comportement natif.
      if (url.hash && url.pathname === window.location.pathname) return;

      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    },
    [navigate],
  );

  return (
    // Aucun rôle, aucun `tabIndex` : ce n'est pas une cible, c'est un écouteur. Les cibles
    // sont les `<a href>` en dessous, et elles restent les seules choses focalisables.
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
