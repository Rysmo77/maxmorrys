import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useToken } from './theme';

/**
 * LE MOT-SYMBOLE — et les deux noms qu'il ne faut jamais confondre.
 *
 *   `rysmo`      le nom de CETTE APPLICATION. Le R prend le bleu, le o final le teal : la
 *                marque garde ses bornes de couleur.
 *   `signature`  la PERSONNE — « Max-Morrys ». Mentions légales, certificat, signature.
 *
 * Le répétiteur, lui, ne s'écrit pas ici : il porte le nom que la personne lui a donné, et il
 * se lit par `useTutorNom()`. Écrire « Rysmo » à sa place rendrait le renommage inintelligible.
 *
 * LE DÉGRADÉ « Hello ! » DU WEB N'EST PAS PORTÉ : `background-clip: text` n'a pas d'équivalent
 * React Native, et il ne sert qu'à la barre du SITE. Les deux variantes utiles en natif
 * colorent lettre par lettre, ce qui est exactement ce que fait le kit ici.
 */
export function Wordmark({
  brand = 'rysmo', size = 22, tail, night, short, style,
}: {
  brand?: 'rysmo' | 'signature';
  size?: number;
  /** Encre du corps du mot. Par défaut l'encre courante — blanc sur un aplat de marque. */
  tail?: string;
  /** Sur fond sombre POSÉ (un aplat de marque), pas en mode sombre : les teintes nuit. */
  night?: boolean;
  /** « Max » seul, sans « -Morrys ». */
  short?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const t = useToken();
  const c = night
    ? { b: t('mmBleuN'), o: t('mmOrangeN'), v: t('mmVioletN'), l: t('mmTealN') }
    : { b: t('mmBleu'), o: t('mmOrange'), v: t('mmViolet'), l: t('mmTeal') };

  const base: TextStyle = {
    fontFamily: 'Fraunces',
    fontWeight: '900',
    fontSize: size,
    letterSpacing: -size * 0.045,
    color: tail ?? t('textBody'),
  };

  if (brand === 'signature') {
    return (
      <Text accessibilityLabel="Max-Morrys" style={[base, style]}>
        <Text style={{ color: c.b }}>M</Text>
        <Text style={{ color: c.o }}>a</Text>
        <Text style={{ color: c.l }}>x</Text>
        {short ? null : (
          <>
            <Text style={{ color: c.v }}>-</Text>
            <Text style={{ color: tail ?? t('textBody') }}>Morrys</Text>
          </>
        )}
      </Text>
    );
  }

  return (
    <Text accessibilityLabel="Rysmo" style={[base, style]}>
      <Text style={{ color: c.b }}>R</Text>
      <Text style={{ color: tail ?? t('textBody') }}>ysm</Text>
      <Text style={{ color: c.l }}>o</Text>
    </Text>
  );
}
