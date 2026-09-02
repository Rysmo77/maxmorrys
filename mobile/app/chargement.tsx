import { View } from 'react-native';
import { Body, Screen, Skeleton, useToken } from '../ds';

/**
 * ══ 3 · LE CHARGEMENT ══ — LE SQUELETTE A LA FORME EXACTE DU CONTENU RÉEL.
 *
 * C'est toute la règle, et elle est mesurable : quand le contenu arrive, RIEN NE SAUTE. Un
 * squelette générique — trois rectangles gris de tailles arbitraires — coûte plus qu'il ne
 * rapporte : il annonce une mise en page, puis une autre arrive, et le saut se lit comme une
 * erreur de chargement.
 *
 * Ce squelette-ci est celui de MON ESPACE, dans son ordre : le sourcil de date, le titre sur
 * deux lignes, la carte de reprise, les deux cases de fait, la carte du répétiteur, puis la
 * liste « dans ton espace ». Chaque bloc a la hauteur de son homologue réel.
 *
 * AUCUNE ANIMATION DE MIROITEMENT. Le web en pose une (`shim`, 1,5 s) ; ici elle coûterait un
 * pilote d'animation par bloc — neuf blocs — sur le profil d'appareil visé. Le squelette dit
 * déjà « ça charge » par sa forme ; le miroitement n'ajoute qu'une raison de chauffer.
 */
export default function Chargement() {
  const t = useToken();

  return (
    <Screen
      territory="forme"
      tabbar
      droite={
        <>
          <Skeleton width={40} height={40} radius={20} label="Chargement" />
          <Skeleton width={40} height={40} radius={20} />
        </>
      }
    >
      <Skeleton width={110} height={11} label="Chargement de ton espace" style={{ marginTop: 10 }} />

      <View style={{ marginTop: 14, gap: 10 }}>
        <Skeleton height={32} width="82%" />
        <Skeleton height={32} width="58%" />
      </View>

      <Skeleton height={124} radius={24} style={{ marginTop: 22 }} />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Skeleton height={86} radius={18} style={{ flex: 1 }} />
        <Skeleton height={86} radius={18} style={{ flex: 1 }} />
      </View>

      <Skeleton height={92} radius={18} style={{ marginTop: 14 }} />

      <Skeleton width={130} height={11} style={{ marginTop: 24 }} />
      <View style={{ gap: 9, marginTop: 12 }}>
        <Skeleton height={46} radius={14} />
        <Skeleton height={46} radius={14} />
        <Skeleton height={46} radius={14} />
      </View>

      <Body
        muted
        style={{ fontFamily: 'JetBrainsMono', fontSize: 11, marginTop: 20, color: t('textFaint') }}
      >
        Quand le contenu arrive, rien ne saute.
      </Body>
    </Screen>
  );
}
