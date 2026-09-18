import { useTranslation } from 'react-i18next';
import { SubNav } from '@ds';
import { useLocalizedPath } from '../../contexts/LanguageContext';

/**
 * LES DEUX SOUS-NAVIGATIONS DE PISTE — CDC du 14/09/2026, §3.2.
 *
 * La navigation globale est passée à quatre entrées neutres : Conception · Apprendre ·
 * À propos · Contact. Le second niveau ne vit donc plus dans la barre haute — et ce n'est
 * pas une commodité de mise en page, c'est la règle du CDC : « Pas de menu déroulant au
 * survol : les deux entrées mènent à des pages mères qui présentent leur piste. »
 *
 * `SubNav` est une primitive de PAGE (lire son en-tête) : elle est en tête de page, elle
 * défile avec elle, et elle existe aux trois largeurs — là où un survol n'existe pas sur
 * mobile. Les pages des deux pistes la posent donc toutes au même endroit, dans leur
 * `PageSite`.
 *
 * ⚠️ `SubNav` compare `active` au LIBELLÉ d'une entrée, pas à une clé. Et `active`
 * *indéfini* allume la PREMIÈRE entrée — ce qui, sur une page mère qui n'est aucune des
 * trois, marquerait faussement la première. D'où `active: null` traduit en chaîne vide :
 * aucune entrée ne correspond, aucune n'est marquée. Le défaut existe déjà dans ce dépôt
 * une fois, sur le pôle média, et il ne se voit ni au typecheck ni à l'écran.
 */

interface ConceptionSubNavProps {
  /** `null` sur la page mère, qui n'est aucun des trois niveaux. */
  active: 'commerces' | 'surMesure' | 'realisations' | null;
  /**
   * `section` sur une FICHE de réalisation : l'étage « Réalisations » est allumé, mais la
   * page affichée n'est pas son index. Sans ça, `aria-current="page"` annonce à un lecteur
   * d'écran qu'il est sur une page où il n'est pas.
   */
  activeKind?: 'page' | 'section';
}

export function ConceptionSubNav({ active, activeKind }: ConceptionSubNavProps) {
  const { t } = useTranslation('nav');
  const path = useLocalizedPath();

  const labels = {
    commerces: t('conceptionCommerces'),
    surMesure: t('conceptionSurMesure'),
    realisations: t('conceptionRealisations'),
  };

  return (
    <SubNav
      label={t('conceptionSubnavLabel')}
      active={active === null ? '' : labels[active]}
      activeKind={activeKind}
      items={[
        /*
         * L'offre productisée d'abord. Le CDC pose les deux niveaux « et n'en cache aucun » ;
         * l'ordre suit l'engagement croissant — on achète en ligne, puis on demande un devis,
         * puis on regarde ce qui a été livré.
         *
         * Seule la première entrée porte un territoire : « Je te digitalise » est le teal, et
         * c'est le seul des trois niveaux qui se range sous un des quatre verbes. Les projets
         * sur mesure et les réalisations vivent hors d'eux — pastille grise, comme l'agence
         * avant eux.
         */
        { label: labels.commerces, href: path('/conception/commerces-et-tpe'), territory: 'digitalise' as const },
        { label: labels.surMesure, href: path('/conception/projets-sur-mesure') },
        { label: labels.realisations, href: path('/conception/realisations') },
      ]}
    />
  );
}

interface ApprendreSubNavProps {
  /** `null` sur la page mère `/apprendre`. */
  active: 'formations' | 'blog' | 'transforme' | 'club' | null;
}

export function ApprendreSubNav({ active }: ApprendreSubNavProps) {
  const { t } = useTranslation('nav');
  const path = useLocalizedPath();

  /*
   * LES QUATRE VERBES RESTENT ÉCRITS À LA PREMIÈRE PERSONNE, et c'est le cœur de la décision
   * du CDC : ils quittent la navigation GLOBALE — où ils accueillaient un directeur financier
   * européen par « Je te digitalise » — mais restent les titres de la piste, à l'intérieur,
   * où ils s'adressent au bon public. Les libellés viennent de la même table `nav` que la
   * barre haute : ils ne sont pas traduits, ils sont écrits.
   */
  const labels = {
    formations: t('formations'),
    blog: t('blog'),
    transforme: t('transform'),
    club: t('transformClub'),
  };

  /*
   * ⚠️ CET ORDRE N'EST PAS CELUI DES CARTES DE `/apprendre`, ET LES DEUX SONT SOURCÉS.
   *
   * Ici : l'ordre de la sous-navigation du CDC §3.2 — « Je te forme · Je t'informe · Je te
   * transforme · Le Club des Digitos ». C'est l'ordre des VERBES, celui que la barre haute a
   * tenu depuis le début et que les gens reconnaissent d'une page à l'autre.
   *
   * Sur la page mère, les cartes suivent l'autre phrase du CDC, §4.3 — « on lit, on écoute,
   * on se forme, on rejoint » : blog, pôle média, formations, Club. C'est un ordre de
   * PARCOURS, du gratuit vers le payant, et il porte l'argument de la page.
   *
   * Les deux cohabitent à trois centimètres l'un de l'autre. C'est délibéré : une barre de
   * repérage qui change d'ordre selon la page cesse d'être un repère, et une page qui range
   * le payant devant le gratuit perd son entonnoir. Ne pas « aligner » l'un sur l'autre sans
   * relire les deux paragraphes du cahier des charges.
   */
  return (
    <SubNav
      label={t('learnSubnavLabel')}
      active={active === null ? '' : labels[active]}
      items={[
        { label: labels.formations, href: path('/formations'), territory: 'forme' as const },
        { label: labels.blog, href: path('/blog'), territory: 'informe' as const },
        /* Le gratuit ouvert AVANT le payant fermé — l'ordre n'est pas négociable, voir
           l'en-tête de `SubNav`. */
        { label: labels.transforme, href: path('/podcast-et-videos'), territory: 'transforme' as const },
        { label: labels.club, href: path('/club-des-digitos'), territory: 'transforme' as const },
      ]}
    />
  );
}
