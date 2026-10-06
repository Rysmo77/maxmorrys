import { View } from 'react-native';
import { Screen, Skeleton, SqueletteGroupe } from '../ds';

/**
 * ══ 3 · LE CHARGEMENT ══ — LE SQUELETTE A LA FORME EXACTE DU CONTENU RÉEL.
 *
 * ⓘ CE N'EST PLUS UNE ROUTE. C'était `app/chargement.tsx`, un écran que RIEN n'ouvrait : un
 * squelette est un ÉTAT de l'écran qu'il préfigure, pas une destination. `(tabs)/espace.tsx`
 * le rend tant que ses lectures ne sont pas tranchées. Il vit hors de `app/`, où tout
 * fichier devient une adresse.
 *
 * C'est toute la règle, et elle est mesurable : quand le contenu arrive, RIEN NE SAUTE.
 *
 * ⚠️ IL NE SAUTAIT PAS — IL CHANGEAIT DE COULEUR. Le squelette était posé sur le maillage
 * `forme` (bleu), l'Espace sur `transforme` (violet) : le fond basculait à l'arrivée des
 * données. Il portait aussi une cloche que l'Espace n'a plus, et trois lignes de liste pour
 * deux. Il suit maintenant l'écran réel, bloc pour bloc.
 *
 * La respiration est celle de `ds/Skeleton.tsx` — une seule valeur animée pour tous les blocs,
 * et une seule annonce pour le lecteur d'écran.
 */
export function ChargementEspace() {
  return (
    <Screen territory="transforme" tabbar droite={<Skeleton width={38} height={38} radius={19} />}>
      <SqueletteGroupe label="Chargement de ton espace">
        <Skeleton width={110} height={11} style={{ marginTop: 10 }} />

        <View style={{ marginTop: 14, gap: 8 }}>
          <Skeleton height={30} width="62%" />
          <Skeleton height={30} width="44%" />
        </View>

        <Skeleton height={124} radius={24} style={{ marginTop: 22 }} />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Skeleton height={92} radius={18} style={{ flex: 1 }} />
          <Skeleton height={92} radius={18} style={{ flex: 1 }} />
        </View>

        <Skeleton height={80} radius={18} style={{ marginTop: 14 }} />

        <Skeleton width={130} height={11} style={{ marginTop: 24 }} />
        <View style={{ gap: 9, marginTop: 12 }}>
          <Skeleton height={56} radius={14} />
          <Skeleton height={56} radius={14} />
        </View>
      </SqueletteGroupe>
    </Screen>
  );
}
