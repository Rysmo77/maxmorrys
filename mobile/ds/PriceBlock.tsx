import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useToken } from './theme';
import { Num, type NumSource } from './Num';

/**
 * LE PRIX — toujours cadré, jamais nu.
 *
 * Le système est explicite : « le prix est toujours cadré au mois ET à l'année. Mensualisé il
 * relève de l'achat impulsif, annualisé il franchit un seuil de délibération. » C'est le rôle
 * de `note` : elle n'est pas une mention légale, elle est la moitié de l'information.
 *
 * LE MONTANT PASSE PAR `<Num>`, donc il porte sa source et sa date. Un prix affiché est un
 * affichage ; **le montant débité est celui recalculé côté serveur**, jamais celui transmis
 * par le client — et c'est vrai à plus forte raison ici, où l'achat sort de l'application.
 */
export function PriceBlock({
  amount, source, asOf, currency = 'FCFA', strike, note, size = 31, style,
}: {
  amount: number;
  source: NumSource;
  asOf: Date;
  currency?: string;
  /** Prix barré. N'existe que s'il y a une promotion RÉELLE au catalogue. */
  strike?: number;
  note?: ReactNode;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <Num value={amount} source={source} asOf={asOf} style={{ fontSize: size, letterSpacing: -1.2 }} />
        <Text style={{ fontFamily: 'SchibstedGrotesk', fontWeight: '600', fontSize: 14, color: t('textBody') }}>
          {currency}
        </Text>
        {strike !== undefined && (
          <Num
            value={strike}
            source={source}
            asOf={asOf}
            style={{ fontSize: 14, color: t('textFaint'), textDecorationLine: 'line-through' }}
          />
        )}
      </View>
      {note !== undefined && (
        typeof note === 'string'
          ? <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 12.5, color: t('textMuted'), marginTop: 4 }}>{note}</Text>
          : <View style={{ marginTop: 4 }}>{note}</View>
      )}
    </View>
  );
}
