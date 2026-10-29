import { useEffect, useRef } from 'react';
import { POLICE } from './police';
import { Animated, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Pressoir } from './Pressoir';
import { COURBE, DUREE, duree, useMouvement } from './mouvement';
import { isIOS, ripple } from './platform';
import { useTeinte } from './espace';
import type { ReactNode } from 'react';
import { useToken, px, veil } from './theme';
import { tokens } from './tokens.generated';
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
type Tone = 'primary' | 'forme' | 'informe' | 'transforme' | 'digitalise' | 'ghost' | 'quiet' | 'ink' | 'danger';

export function Button({
  tone = 'primary', size = 'md', label, onPress, disabled, icon, trailing, leading, fullWidth, style,
  confirmation, confirme,
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
  /**
   * LA CONFIRMATION SUR PLACE — « Copié », « Place réservée ». Tant que `confirme` est vrai
   * (`useConfirmation`), le libellé devient celui-ci, précédé d'une coche, en fondu 220 ms ;
   * il revient seul. Pas de notification flottante : le résultat s'affiche là où est le doigt.
   */
  confirmation?: string;
  confirme?: boolean;
}) {
  const t = useToken();
  const g = useActionGradient();
  /* `mm-r-btn` du kit v4.5 : le bouton principal prend le dégradé de l'ESPACE (`--rv-grad`) —
     bleu dans Apprendre, violet au Club et chez l'assistant, aplat d'encre à l'accueil. */
  const teinte = useTeinte();
  const sm = size === 'sm';
  const enConfirmation = !!confirme && confirmation !== undefined;
  const libelle = enConfirmation ? confirmation : label;
  const glyphe: IconName | undefined = enConfirmation ? 'check' : icon;

  /* Les quatre territoires portent un dégradé ; les quatre autres tons, un aplat de jeton. */
  /*
   * ⚠️ LE DÉGRADÉ « DIGITALISE » PART D'UN TURQUOISE PLUS SOMBRE. Le kit le fait partir de
   * #02AC9C, où le libellé blanc tombe à 2,84:1 — sous le seuil, sur le bouton de réservation
   * et d'activation. Il part ici de l'encre de texte turquoise (`mmTealT`, 6,6:1), FIXE dans
   * les deux modes comme le dégradé lui-même : la teinte reste celle du territoire.
   */
  const degrade: Partial<Record<Tone, readonly string[]>> = disabled ? {} : {
    primary: teinte.degrade.length > 1 ? teinte.degrade : undefined,
    forme: g.forme, informe: g.informe, transforme: g.transforme,
    digitalise: [tokens.light.mmTealT, tokens.light.mmBleu],
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
    /* Material 3 : le bouton secondaire est CONTOURÉ (filet neutre, encre de l'espace) ;
       iOS garde son contour d'encre. */
    ghost: isIOS
      ? { bg: t('btnGhostBg'), fg: t('ink'), brd: t('ink') }
      : { bg: 'transparent', fg: teinte.rv2, brd: t('ink3') },
    quiet: { bg: t('surfaceQuiet'), fg: t('ink'), brd: t('borderHair') },
    ink: { bg: t('surfaceInk'), fg: t('paperFixed') },
    /* Le ton DESTRUCTIF — « Supprimer mon compte », « Bloquer ». Un voile de `stop` et son
       encre : lisible dans les deux modes, et distinct d'une action ordinaire avant d'être lu. */
    danger: { bg: veil(t('stop'), 0.1), fg: t('stop'), brd: veil(t('stop'), 0.45) },
  };

  const rayon = isIOS ? (sm ? 12 : 14) : px(t('rPill'));
  const c = disabled ? { bg: t('btnOffBg'), fg: t('ink3'), brd: undefined } : aplat[tone];
  const arrets = degrade[tone];
  /* Sur le dégradé d'espace, l'encre reste blanche dans les deux modes (`paperFixed`). */
  const fg = tone === 'primary' && arrets ? t('paperFixed') : c.fg;

  const forme: ViewStyle = {
    /* 52 px et un rayon de 14 sur iOS ; 48 px et la pilule sur Android (Material 3). */
    minHeight: sm ? 42 : Math.max(isIOS ? 52 : 48, px(t('touchBtn'))),
    paddingHorizontal: sm ? 17 : 22,
    borderRadius: rayon,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    alignSelf: (fullWidth ?? !sm) ? 'stretch' : 'flex-start',
  };

  const texte = (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      maxFontSizeMultiplier={1.5}
      style={{
        flexShrink: 1,
        fontFamily: POLICE.corps, fontWeight: isIOS ? '600' : '500',
        fontSize: sm ? 13.5 : isIOS ? 16 : 15, letterSpacing: isIOS ? 0 : 0.15,
        color: fg,
      }}
    >
      {libelle}
    </Text>
  );

  /* Le contenu change en fondu quand la confirmation arrive ou repart : la clé rejoue
     l'apparition, sans démonter le bouton (l'enfoncement en cours n'est pas coupé). */
  const contenu = (
    <Fondu cle={enConfirmation ? 'ok' : 'repos'}>
      {enConfirmation ? null : leading}
      {glyphe ? <Icon name={glyphe} size={sm ? 15 : 17} color={fg} strokeWidth={enConfirmation ? 2.8 : 2.2} /> : null}
      {texte}
      {trailing && !enConfirmation ? <Icon name={trailing} size={sm ? 15 : 16} color={fg} strokeWidth={2.6} /> : null}
    </Fondu>
  );

  return (
    <Pressoir
      desactive={disabled}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      /* Le dessin d'un `sm` fait 42 ; la cible, elle, atteint le plancher de 44. */
      hitSlop={sm ? { top: 2, bottom: 2 } : undefined}
      /*
        L'ONDULATION EST LE « J'AI SENTI TON DOIGT » D'ANDROID, comme l'enfoncement est celui
        d'iOS. `ripple()` rend `undefined` sur iOS : le `scale(.975)` y reste le seul retour.
        La couleur est l'encre du bouton — sur un fond de marque, une onde grise se voit comme
        une salissure.
      */
      android_ripple={disabled ? undefined : ripple(fg)}
      style={[
        arrets ? { alignSelf: forme.alignSelf } : forme,
        /* L'ombre teintée du kit, iOS seulement : Material 3 détache par la couleur, pas l'ombre. */
        arrets && isIOS && !sm ? {
          shadowColor: tone === 'primary' ? teinte.rv : arrets[0], shadowOpacity: 0.28,
          shadowRadius: 11, shadowOffset: { width: 0, height: 8 },
        } : null,
        arrets ? null : {
          backgroundColor: c.bg,
          borderWidth: c.brd ? (tone === 'ghost' ? 1.5 : 1) : 0,
          borderColor: c.brd,
        },
        style,
      ]}
    >
      {arrets ? (
        <Gradient colors={arrets} radius={rayon} style={forme}>
          {contenu}
        </Gradient>
      ) : contenu}
    </Pressoir>
  );
}

function Fondu({ cle, children }: { cle: string; children: ReactNode }) {
  const { reduit } = useMouvement();
  const premier = useRef(true);
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (premier.current) { premier.current = false; return; }
    o.setValue(0);
    Animated.timing(o, { toValue: 1, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true }).start();
  }, [cle, o, reduit]);
  return (
    <Animated.View style={{ opacity: o, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 1 }}>
      {children}
    </Animated.View>
  );
}
