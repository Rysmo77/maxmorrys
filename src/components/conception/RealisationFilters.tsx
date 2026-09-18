import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChipRow } from '@ds';
import { SiteEyebrow } from '../site';
import { categoryKey } from '../../lib/brand';

/**
 * Barre de filtres par catégorie de `/conception/realisations`.
 *
 * ── ELLE NE REDESSINE PLUS SA PILULE  (17/09/2026) ────────────────────────────────────
 *
 * Elle portait sa propre pilule — classes, états, contraste — alors que `ChipRow` du kit fait
 * exactement ça et est déjà monté sur `/blog`, `/faq` et `/formations`. Deux dessins de la
 * même commande dérivent l'un de l'autre au premier ajustement, et c'est le second qui reste
 * en arrière : `ChipRow` porte un défilement horizontal RÉEL et une cible de 44 px étendue
 * sous un dessin de 40, deux choses que cette barre n'avait pas.
 *
 * Deux choses lui restent en propre, parce que le kit ne les porte pas :
 *
 *  • L'ENTRÉE « TOUTES », distincte des sept catégories. `ChipRow` ne connaît pas l'absence
 *    de filtre : elle est passée en tête des options et retraduite en `null` à la sortie.
 *  • LA LIGNE DE COMPTAGE `aria-live`. Sans elle, un filtre est muet pour un lecteur d'écran :
 *    la liste change sous le curseur et rien ne l'annonce.
 *
 * ── LE SOURCIL N'EST PAS UNE DÉCORATION ───────────────────────────────────────────────
 *
 * La `SubNav` de piste et cette rangée ont la même forme, et deux puces actives cohabitent à
 * l'écran avec deux sens opposés — l'une dit OÙ L'ON EST, l'autre CE QU'ON MONTRE. Un sourcil
 * qui annonce la rangée suffit à la retirer de la lecture « destination » : une rangée qui
 * s'annonce cesse d'être lue comme une navigation.
 *
 * ⚠️ Les sept libellés de catégorie viennent de `shared:realisations.categories.*`, seule
 * source depuis que les deux copies jumelles (`conception:work.categories` et
 * `realisations:categories`, identiques à l'octet près) ont été supprimées.
 */

interface RealisationFiltersProps {
  /** Catégories réellement présentes dans le jeu de données. */
  categories: readonly string[];
  /** Catégorie active, ou `null` pour « Toutes ». */
  active: string | null;
  onChange: (category: string | null) => void;
  /** Nombre de réalisations après filtrage — annoncé aux lecteurs d'écran. */
  resultCount: number;
}

export default function RealisationFilters({
  categories,
  active,
  onChange,
  resultCount,
}: RealisationFiltersProps) {
  const { t } = useTranslation('realisations');
  const { t: ts } = useTranslation('shared');

  /*
   * `ChipRow` échange des LIBELLÉS, pas des clés — comme sur `/blog`. La table inverse vit
   * donc ici, et « Toutes » y a son entrée : c'est elle qui porte l'absence de filtre.
   */
  const chips = useMemo(() => {
    const tous = t('index.filterAll');
    const versCategorie = new Map<string, string | null>([[tous, null]]);
    const versLibelle = new Map<string, string>();
    for (const cat of categories) {
      const libelle = ts(`realisations.categories.${categoryKey(cat)}`);
      versCategorie.set(libelle, cat);
      versLibelle.set(cat, libelle);
    }
    return { options: [tous, ...categories.map((c) => versLibelle.get(c) ?? c)], versCategorie, versLibelle };
  }, [categories, t, ts]);

  // Une seule catégorie ne partitionne rien : la barre ne s'affiche pas.
  if (categories.length < 2) return null;

  return (
    <div>
      <SiteEyebrow>{t('index.filterEyebrow')}</SiteEyebrow>

      <ChipRow
        label={t('index.filterAria')}
        options={chips.options}
        value={(active && chips.versLibelle.get(active)) || chips.options[0]}
        onChange={(option) => onChange(chips.versCategorie.get(option) ?? null)}
      />

      {/* Le comptage est annoncé : sans lui, un filtre est muet pour un lecteur d'écran.
          Il DÉRIVE de la liste rendue juste en dessous, qui est statique — il ne part donc
          jamais de zéro en attendant une lecture, contrairement aux index qui lisent Firestore. */}
      <p aria-live="polite" className="mt-3 text-sm text-ink-2">
        {t('index.resultCount', { count: resultCount })}
      </p>
    </div>
  );
}
