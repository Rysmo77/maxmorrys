import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Display, Eyebrow, Icon, Mesh, Surface, useToken } from '../../ds';

/**
 * LE CLUB DES DIGITOS.
 *
 * DEUX RÈGLES DU SYSTÈME SE CROISENT ICI, ET AUCUNE N'EST DÉCORATIVE :
 *
 *   • AUCUN EMOJI. Le Club en porte pourtant en base — `MOOD_OPTIONS`, `CLUB_CATEGORIES.emoji`
 *     côté web — parce que ce sont des DONNÉES écrites sur des enregistrements réels, pas des
 *     ornements de mise en page. La règle porte sur ce qu'on REND, pas sur ce qu'on stocke :
 *     à l'écran, un glyphe du jeu ou une étiquette.
 *   • AUCUN NOMBRE DE MEMBRES. « Nous sommes déjà 1 200 » est l'un des six interdits absolus,
 *     et c'est exactement le chiffre qu'une page de club a envie d'écrire. Il n'y en a donc
 *     pas — ni ici, ni ailleurs, tant qu'il ne vient pas d'un relevé daté.
 */
export default function Club() {
  const t = useToken();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Le Club des Digitos</Eyebrow>
        <Display lines={['Entre gens', 'qui vendent.']} style={{ marginTop: 6 }} />
        <Body muted style={{ marginTop: 12 }}>
          Des commerçants et des indépendants qui montrent ce qu'ils essaient, ce qui marche
          et ce qui rate. Pas un fil d'actualité : un endroit où poser une question précise et
          recevoir une réponse de quelqu'un qui l'a déjà faite.
        </Body>

        <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="users" size={20} color={t('ink2')} />
            <Body style={{ flex: 1, fontWeight: '700' }}>Le fil n'est pas encore branché</Body>
          </View>
          <Body muted style={{ marginTop: 8 }}>
            Ce port natif rend la place du Club, pas encore ses publications. Rien n'est
            simulé : un message inventé dans ce fil serait attribué à quelqu'un.
          </Body>
        </Surface>

        <Surface level="truth" style={{ marginTop: 14, padding: 18 }}>
          <Eyebrow>Ce que l'abonnement ne garantit pas</Eyebrow>
          <Body muted style={{ marginTop: 6 }}>
            Ni des clients, ni un revenu. Il donne l'accès au groupe, aux sessions et aux
            réponses — le reste dépend de ce que tu y mets. C'est écrit ici pour que tu n'aies
            pas à le découvrir après avoir payé.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
