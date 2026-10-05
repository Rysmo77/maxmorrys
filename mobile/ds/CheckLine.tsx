import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken, veil } from './theme';
import { Icon } from './Icon';

/**
 * CE QUI EST DÛ, UNE LIGNE PAR ENGAGEMENT — et ce qui ne l'est pas, avec un tiret.
 *
 * Motif central de la page du Club, où il porte les cinq choses qui ne dépendent que d'une
 * personne. La règle y est stricte : **une ligne à coche ne décrit jamais l'ambiance**, elle
 * décrit ce qu'une personne peut garantir seule. « Une communauté bienveillante » n'est pas
 * une ligne à coche ; « deux sessions en direct par mois, avec moi » en est une.
 *
 * `dash` remplace la coche par un TIRET, jamais par une croix : c'est la forme du renvoi
 * (« autre chose, si… »). On n'écarte pas quelqu'un, on l'oriente.
 */
export function CheckLine({
  tone = 'violet', dash, children, style,
}: {
  tone?: 'violet' | 'ok' | 'neutre';
  dash?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const skin = {
    violet: { bg: veil(t('mmViolet'), 0.15), ink: t('mmVioletT') },
    ok: { bg: veil(t('ok'), 0.15), ink: t('ok') },
    neutre: { bg: t('fill2'), ink: t('ink2') },
  }[tone];

  return (
    <View style={[{ flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginTop: 10 }, style]}>
      <View style={{
        width: 22, height: 22, borderRadius: 11, marginTop: 1,
        alignItems: 'center', justifyContent: 'center', backgroundColor: skin.bg,
      }}>
        {/*
          LE TIRET EST UN TRAIT, PAS UNE CROIX — et surtout pas le glyphe `close`.

          Le jeu de 96 glyphes du système n'a pas de « moins » : le web dessine le tiret en
          SVG brut, `M6 12h12`. Prendre `close` faute de mieux rendrait une CROIX, c'est-à-dire
          exactement ce que le kit refuse — « on n'écarte pas quelqu'un, on l'oriente ». Une
          barre de 12 × 3 aux bouts arrondis rend le même trait, sans inventer de glyphe ni
          en détourner un.
        */}
        {dash
          ? <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: skin.ink }} />
          : <Icon name="check" size={12} color={skin.ink} strokeWidth={3.4} />}
      </View>
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 14.5, lineHeight: 22, color: t('textBody') }}>
            {children}
          </Text>
        ) : children}
      </View>
    </View>
  );
}
