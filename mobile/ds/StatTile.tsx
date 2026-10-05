import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useToken, px } from './theme';
import { Num, type NumSource } from './Num';

/**
 * LA CASE DE RELEVÉ — et la règle qui la gouverne.
 *
 * « Toute case de relevé porte SA DATE. Une case sans date affiche "non relevé", jamais une
 * estimation. » C'est pour ça que `source` et `asOf` sont OBLIGATOIRES ici : le type refuse
 * une case qui ne pourrait pas se justifier, plutôt que de compter sur la relecture.
 *
 * `<Num>` porte le reste : la monospace tabulaire, le séparateur de milliers de la langue, et
 * le repli « non relevé » quand la valeur est nulle.
 */
export function StatTile({
  label, value, source, asOf, foot, style,
}: {
  label: string;
  value: number | string | null;
  source: NumSource;
  asOf: Date | null;
  foot?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  return (
    <View style={[{
      padding: 16, borderRadius: px(t('rL')),
      backgroundColor: t('surfaceCardFlat'),
      borderWidth: 1, borderColor: t('borderGlass'),
    }, style]}>
      <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 11, color: t('textMuted') }}>{label}</Text>
      {/*
        PAS DE DATE, PAS DE NOMBRE. `asOf` est nulle tant qu'aucune lecture n'a abouti : la
        case affiche alors « non relevé », jamais une estimation ni un zéro qu'on prendrait
        pour une mesure. C'est la règle 6 rendue structurelle — `Num` exige une date, donc on
        ne peut pas l'appeler sans en avoir une, et le repli est le même texte que le sien.
      */}
      {asOf === null
        ? <Num value={null} source={source} asOf={new Date(0)} style={{ fontSize: 27, marginTop: 3 }} />
        : <Num value={value} source={source} asOf={asOf} style={{ fontSize: 27, marginTop: 3 }} />}
      {foot ? (
        <Text style={{ fontFamily: 'SchibstedGrotesk', fontSize: 11, color: t('textMuted') }}>{foot}</Text>
      ) : null}
    </View>
  );
}
