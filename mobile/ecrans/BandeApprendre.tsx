import { router, usePathname } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';
import { ChipRow } from '../ds';

/**
 * LA BANDE D'APPRENDRE — les six sections des maquettes v3 (Rysmo-iOS-11, 12, 19, 21, 22, 24) et
 * du PRD rév. 6 §5.1 : Mes formations · Catalogue · Cohorte · Notes · Succès · Téléchargements.
 *
 * ⭐ PASSE 2 (29/10/2026) : la bande de la passe 1 n'en portait que quatre (« la cohorte et les
 * succès n'ont ni données ni code ») et mettait les certificats à la place des succès. Le porteur
 * a tranché : un écran sans backend se CONSTRUIT, avec un état vide honnête. Les six existent.
 *
 * Mes formations est l'onglet (`/cours`) ; les cinq autres sont des écrans empilés au-dessus.
 * Depuis l'onglet, on POUSSE ; d'une section à l'autre, on REMPLACE (la bande ne doit pas faire
 * remonter le retour à travers l'historique des sections) ; vers l'onglet, on y RETOURNE.
 */
export const BANDE_APPRENDRE = [
  { libelle: 'Mes formations', href: '/cours' },
  { libelle: 'Catalogue', href: '/catalogue' },
  { libelle: 'Cohorte', href: '/cohorte' },
  { libelle: 'Notes', href: '/notes' },
  /* `/reussites`, pas `/succes` : ce nom-là est celui de l'ancien tunnel de paiement, que
     `mobile-store-achats.test.ts` interdit de recréer. */
  { libelle: 'Succès', href: '/reussites' },
  { libelle: 'Téléchargements', href: '/telechargements' },
] as const;

export function BandeApprendre({ style }: { style?: StyleProp<ViewStyle> }) {
  const chemin = usePathname();
  const actif = BANDE_APPRENDRE.find((b) => b.href === chemin) ?? BANDE_APPRENDRE[0];
  return (
    <ChipRow
      options={BANDE_APPRENDRE.map((b) => b.libelle)}
      value={actif.libelle}
      height={38}
      debord={18}
      onChange={(libelle) => {
        const cible = BANDE_APPRENDRE.find((b) => b.libelle === libelle);
        if (!cible || cible === actif) return;
        if (cible.href === '/cours') router.navigate('/cours');
        else if (actif.href === '/cours') router.push(cible.href);
        else router.replace(cible.href);
      }}
      style={[{ marginTop: 14 }, style]}
    />
  );
}
