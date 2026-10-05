import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { ripple } from './platform';
import type { ReactNode } from 'react';
import { useToken, px } from './theme';
import { Gradient, useActionGradient } from './Gradient';
import { Icon, type IconName } from './Icon';

/**
 * Le bouton. Cinq tons, un par territoire, plus trois neutres.
 *
 * TROIS CHOSES QUE LE NATIF REPREND TELLES QUELLES :
 *
 *   • L'APPUI À 120 ms, `scale(.975)`. C'est le retour principal du système — « j'ai senti
 *     ton doigt » — et il y en a TOUJOURS un. `Pressable` le donne sans animation à écrire.
 *   • L'ENCRE DU TON ORANGE EST FIXE. Elle ne suit pas le mode : `inkFixed`, jamais `ink`,
 *     qui deviendrait blanc en nuit et donnerait du blanc sur orange clair.
 *   • LES DÉGRADÉS. Les quatre tons de territoire sont des DÉGRADÉS dans le système, et ils
 *     le sont enfin ici : `Gradient` les rend en SVG, un objet de rendu figé qui ne coûte
 *     rien par image (voir `ds/Gradient.tsx`). Le port posait jusqu'ici leur premier arrêt en
 *     aplat — honnête, mais c'était retirer au produit la seule chose qui fait qu'un bouton
 *     de marque se reconnaît avant d'être lu.
 *
 * LA LARGEUR SUIT LA TAILLE, comme au web : un bouton `md` remplit sa colonne (c'est l'action
 * d'un écran), un `sm` se dimensionne sur son texte (c'est une action de ligne). `fullWidth`
 * tranche quand le cas particulier existe — deux `sm` côte à côte, chacun à `flex: 1`.
 */
type Tone = 'primary' | 'forme' | 'informe' | 'transforme' | 'digitalise' | 'ghost' | 'quiet' | 'ink';

export function Button({
  tone = 'primary', size = 'md', label, onPress, disabled, icon, trailing, leading, fullWidth, style,
}: {
  tone?: Tone;
  size?: 'sm' | 'md';
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /**
   * Le glyphe de TÊTE, par son NOM — pas un nœud déjà rendu. C'est ce qui garantit qu'il
   * prenne l'encre du ton : un `<Icon>` construit par l'appelant devrait deviner cette encre,
   * et il devinerait faux le jour où le ton change ou le mode bascule.
   */
  icon?: IconName;
  /** Le glyphe de QUEUE — la flèche d'un lien sortant. Après le texte, jamais avant. */
  trailing?: IconName;
  /** Une marque TIERCE (Apple, Google) : elle ne se recolore pas, donc elle arrive rendue. */
  leading?: ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const g = useActionGradient();
  const sm = size === 'sm';

  /* Les quatre territoires portent un dégradé ; les quatre autres tons, un aplat de jeton. */
  const degrade: Partial<Record<Tone, readonly string[]>> = disabled ? {} : {
    forme: g.forme, informe: g.informe, transforme: g.transforme, digitalise: g.digitalise,
  };

  const aplat: Record<Tone, { bg: string; fg: string; brd?: string }> = {
    primary: { bg: t('actionPrimary'), fg: t('textOnPrimary') },
    /*
      `paperFixed`, et surtout PAS `textOnPrimary`. Les deux valent #FFFFFF en clair, ce qui
      les rend interchangeables à l'œil — mais `textOnPrimary` bascule en nuit, parce que le
      ton `primary` inverse son fond. Les tons de territoire ne l'inversent pas : leur fond
      reste la teinte saturée dans les deux modes, et leur encre doit rester blanche.
    */
    forme: { bg: t('mmBleu'), fg: t('paperFixed') },
    informe: { bg: t('mmOrange'), fg: t('inkFixed') },
    transforme: { bg: t('mmViolet'), fg: t('paperFixed') },
    digitalise: { bg: t('mmTeal'), fg: t('paperFixed') },
    ghost: { bg: t('btnGhostBg'), fg: t('ink'), brd: t('ink') },
    quiet: { bg: t('surfaceQuiet'), fg: t('ink'), brd: t('borderHair') },
    ink: { bg: t('surfaceInk'), fg: t('paperFixed') },
  };

  const c = disabled ? { bg: t('btnOffBg'), fg: t('ink3'), brd: undefined } : aplat[tone];
  const arrets = degrade[tone];

  const forme: ViewStyle = {
    minHeight: sm ? 42 : px(t('touchBtn')),
    paddingHorizontal: sm ? 17 : 22,
    borderRadius: px(t('rPill')),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: (fullWidth ?? !sm) ? 'stretch' : 'flex-start',
  };

  const texte = (
    <Text
      numberOfLines={1}
      style={{
        fontFamily: 'SchibstedGrotesk', fontWeight: '700',
        fontSize: sm ? 13.5 : 15, color: c.fg,
      }}
    >
      {label}
    </Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      /*
        L'ONDULATION EST LE « J'AI SENTI TON DOIGT » D'ANDROID, comme l'enfoncement est celui
        d'iOS. `ripple()` rend `undefined` sur iOS : le `scale(.975)` y reste le seul retour.
        La couleur est l'encre du bouton — sur un fond de marque, une onde grise se voit comme
        une salissure.
      */
      android_ripple={disabled ? undefined : ripple(c.fg)}
      style={({ pressed }: { pressed: boolean }) => [
        arrets ? { alignSelf: forme.alignSelf } : forme,
        arrets ? null : {
          backgroundColor: c.bg,
          borderWidth: c.brd ? (tone === 'ghost' ? 1.5 : 1) : 0,
          borderColor: c.brd,
        },
        { transform: [{ scale: pressed && !disabled ? Number.parseFloat(t('pressScale')) || 0.975 : 1 }] },
        style,
      ]}
    >
      {arrets ? (
        <Gradient colors={arrets} radius={px(t('rPill'))} style={forme}>
          {leading}
          {icon ? <Icon name={icon} size={sm ? 15 : 17} color={c.fg} strokeWidth={2.2} /> : null}
          {texte}
          {trailing ? <Icon name={trailing} size={sm ? 15 : 16} color={c.fg} strokeWidth={2.6} /> : null}
        </Gradient>
      ) : (
        <>
          {leading}
          {icon ? <Icon name={icon} size={sm ? 15 : 17} color={c.fg} strokeWidth={2.2} /> : null}
          {texte}
          {trailing ? <Icon name={trailing} size={sm ? 15 : 16} color={c.fg} strokeWidth={2.6} /> : null}
        </>
      )}
    </Pressable>
  );
}
