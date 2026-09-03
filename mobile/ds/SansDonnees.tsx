import { View } from 'react-native';
import type { ReactNode } from 'react';
import { Body, Eyebrow } from './Type';
import { Surface } from './Surface';
import { Icon } from './Icon';
import { useToken } from './theme';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * CE QUI S'AFFICHE QUAND IL N'Y A RIEN — et pourquoi c'est un composant, pas une phrase.
 *
 * En production, `contenu/demo.ts` ne rend rien : le contenu du transfert n'est même pas
 * embarqué dans le paquet. Chaque écran doit alors dire quelque chose, et ce quelque chose
 * n'est PAS « une erreur est survenue » ni un écran blanc.
 *
 * Le port d'origine avait déjà la bonne formule, et elle tient en trois temps :
 *   1 · CE QUI MANQUE, nommé — « tes cours », « ce fil », pas « les données ».
 *   2 · D'OÙ ÇA VIENDRA — le compte, le serveur. C'est ce qui distingue « pas encore branché »
 *       de « cassé », et ça évite d'écrire au support.
 *   3 · POURQUOI RIEN N'EST INVENTÉ À LA PLACE. C'est la phrase qui change le ton : on ne
 *       s'excuse pas d'un vide, on explique un refus.
 *
 * Un composant et pas une phrase recopiée : à 27 écrans, une phrase recopiée devient 27
 * formulations qui divergent, et la troisième ligne — la seule qui demande un effort — est la
 * première à sauter.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export function SansDonnees({
  quoi, origine = 'de ton compte', degat, action, style,
}: {
  /** Ce qui manque, nommé : « ta formation », « le fil du Club ». */
  quoi: string;
  /** D'où ça viendra. « de ton compte » par défaut — la réponse vraie neuf fois sur dix. */
  origine?: string;
  /**
   * Le dommage qu'une simulation causerait, propre à cet écran. C'est la ligne qui porte la
   * décision : un cours inventé est un cours qu'on croit avoir, un message inventé porte le
   * nom de quelqu'un. Omise, une phrase générale prend sa place — mais elle dit moins.
   */
  degat?: string;
  action?: ReactNode;
  style?: React.ComponentProps<typeof Surface>['style'];
}) {
  const t = useToken();

  return (
    <Surface level="flat" style={[{ padding: 20 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="info" size={20} color={t('ink2')} />
        <Body style={{ flex: 1, fontWeight: '700' }}>
          {quoi.charAt(0).toUpperCase() + quoi.slice(1)} n'est pas encore là
        </Body>
      </View>

      <Body muted style={{ marginTop: 10, lineHeight: 22 }}>
        Ça vient {origine}, et cette application ne l'interroge pas encore.
      </Body>

      <Eyebrow style={{ marginTop: 16 }}>Pourquoi il n'y a rien à la place</Eyebrow>
      <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
        {degat ?? "Parce qu'inventer une valeur ici la rendrait crédible. Un contenu de démonstration se reconnaît sur une maquette ; dans la main de quelqu'un, il ne se distingue plus du vrai."}
      </Body>

      {action !== undefined ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </Surface>
  );
}
