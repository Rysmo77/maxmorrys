import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useToken, px } from './theme';

/**
 * LE SEUL CHEMIN DU NATIF VERS LA MONOSPACE, POUR UN CHIFFRE.
 *
 * La règle 6 ne s'arrête pas à la frontière de la plateforme : « un nombre en monospace vient
 * de la base ou d'une source citée. Sinon il ne s'affiche pas. » Elle vient d'un fait, et le
 * fait ne change pas selon l'appareil — les chiffres de façade du produit étaient contredits
 * par la base de production, et ils se vérifient en trente secondes.
 *
 * `source` et `asOf` sont donc obligatoires ici aussi. Et `value = null` ne rend PAS un tiret :
 * il rend le repli, qui dit pourquoi la valeur manque. Un tiret cache la différence entre
 * « c'est zéro » et « je ne sais pas », et cette différence est précisément l'information.
 */
export type NumSource = 'db' | 'server' | { cite: string };

export interface NumProps {
  value: number | string | null | undefined;
  source: NumSource;
  asOf: Date;
  unit?: string;
  fallback?: string;
  locale?: 'fr' | 'en';
  style?: StyleProp<TextStyle>;
}

/** Espace insécable en français (95 000 F), virgule en anglais (95,000 F). */
function group(n: number, locale: 'fr' | 'en'): string {
  const [int, dec] = Math.abs(n).toString().split('.');
  const sep = locale === 'en' ? ',' : ' ';
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return (n < 0 ? '-' : '') + grouped + (dec ? (locale === 'en' ? '.' : ',') + dec : '');
}

export function Num({ value, source, asOf, unit, fallback, locale = 'fr', style }: NumProps) {
  const t = useToken();
  void source;
  void asOf;

  if (value === null || value === undefined || value === '') {
    return (
      <Text style={[{ fontFamily: 'SchibstedGrotesk', color: t('textMuted'), fontSize: px(t('fsMeta2')), fontStyle: 'italic' }, style]}>
        {fallback ?? (locale === 'en' ? 'not measured' : 'non relevé')}
      </Text>
    );
  }

  return (
    <Text style={[{
      fontFamily: 'JetBrainsMono',
      fontWeight: '700',
      color: t('textNum'),
      // `fontVariant` tabulaire : sans lui, une colonne de nombres qui se met à jour tressaute.
      fontVariant: ['tabular-nums'],
    }, style]}>
      {typeof value === 'number' ? group(value, locale) : value}
      {unit ? <Text style={{ fontFamily: 'SchibstedGrotesk', fontWeight: '400' }}>{` ${unit}`}</Text> : null}
    </Text>
  );
}
