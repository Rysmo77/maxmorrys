import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { POLICE } from './police';
import { isIOS, ripple } from './platform';
import { useTeinte } from './espace';
import { useToken, veil } from './theme';
import { Icon, type IconName } from './Icon';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA LISTE DU KIT v4.5 — `mm-r-list` / `mm-r-li` / `mm-r-h`. Un contenu, deux châssis.
 *
 *   · iOS : groupe EN ENCART — carte `bento` à 14 px, rangées de 52, pastille carrée de 30 à
 *     8 px dans la teinte de l'espace, filet inséré à 54 px, chevron à droite.
 *   · Android (Material 3) : rangées PLEINE LARGEUR de 64, sans filet ni chevron, pastille
 *     RONDE de 40 sur le fond doux de l'espace. La liste déborde de la gouttière de l'écran.
 *
 * L'écran écrit `<Liste><Ligne …/></Liste>` une fois ; ce fichier décide du reste.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

type LigneProps = {
  icone?: IconName;
  /** Fond de la pastille quand il porte un sens (le média, l'orange d'un podcast). Sinon la teinte de l'espace. */
  fondIcone?: string;
  titre: ReactNode;
  /** La ligne secondaire, sous le titre. */
  sous?: ReactNode;
  /** Une valeur courte, alignée à droite (« 2 q. », « aujourd'hui »). */
  valeur?: string;
  /** Un contrôle à droite — interrupteur, badge. Remplace le chevron. */
  droite?: ReactNode;
  onPress?: () => void;
  /** Ligne destructive (se déconnecter, supprimer). */
  danger?: boolean;
  accessibilityLabel?: string;
};

export function Liste({ children, gouttiere = 18, style }: {
  children: ReactNode;
  /** La gouttière de l'écran, que la liste Android franchit pour toucher les bords. */
  gouttiere?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useToken();
  const lignes = Children.toArray(children).filter(isValidElement) as ReactElement<LigneProps>[];
  return (
    <View
      style={[
        isIOS
          ? { backgroundColor: t('bento'), borderWidth: 1, borderColor: t('line'), borderRadius: 14, overflow: 'hidden' }
          : { marginHorizontal: -gouttiere },
        style,
      ]}
    >
      {lignes.map((l, i) => (
        <Fragment key={l.key ?? i}>
          {isIOS && i > 0 ? (
            <View style={{
              height: 1, backgroundColor: t('line'),
              marginLeft: l.props.icone || lignes[i - 1].props.icone ? 54 : 14,
            }} />
          ) : null}
          {l}
        </Fragment>
      ))}
    </View>
  );
}

export function Ligne({ icone, fondIcone, titre, sous, valeur, droite, onPress, danger, accessibilityLabel }: LigneProps) {
  const t = useToken();
  const teinte = useTeinte();
  const encre = danger ? t('stop') : t('textBody');

  const pastille = icone ? (
    <View style={{
      width: isIOS ? 30 : 40, height: isIOS ? 30 : 40, borderRadius: isIOS ? 8 : 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: fondIcone ?? (danger ? veil(t('stop'), 0.12) : isIOS ? teinte.rv : teinte.doux),
    }}>
      <Icon
        name={icone}
        size={isIOS ? 17 : 20}
        color={danger ? t('stop') : fondIcone ? t('paperFixed') : !isIOS ? teinte.surDoux : teinte.rv === t('ink') ? t('textOnPrimary') : t('paperFixed')}
        strokeWidth={2.1}
      />
    </View>
  ) : null;

  const corps = (
    <>
      {pastille}
      <View style={{ flex: 1, minWidth: 0 }}>
        {typeof titre === 'string' ? (
          <Text style={{
            fontFamily: POLICE.corps, fontSize: isIOS ? 15 : 16, fontWeight: isIOS ? '500' : '400',
            lineHeight: isIOS ? 19.5 : 21, color: encre,
          }}>
            {titre}
          </Text>
        ) : titre}
        {sous === undefined || sous === null ? null : typeof sous === 'string' ? (
          <Text style={{ fontFamily: POLICE.corps, fontSize: 13, lineHeight: 17.5, color: t('textMuted'), marginTop: 2 }}>
            {sous}
          </Text>
        ) : <View style={{ marginTop: 2 }}>{sous}</View>}
      </View>
      {valeur ? (
        <Text style={{ fontFamily: POLICE.corps, fontSize: 14, color: t('textMuted') }}>{valeur}</Text>
      ) : null}
      {droite}
      {isIOS && onPress && droite === undefined ? (
        <Icon name="forward" size={18} color={t('ink3')} strokeWidth={2.2} />
      ) : null}
    </>
  );

  const forme: ViewStyle = {
    flexDirection: 'row', alignItems: 'center',
    gap: isIOS ? 12 : 16,
    minHeight: isIOS ? 52 : 64,
    paddingVertical: 10,
    paddingHorizontal: isIOS ? 14 : 24,
  };

  const libelle = accessibilityLabel
    ?? [titre, sous, valeur].filter((x): x is string => typeof x === 'string').join(', ');

  if (!onPress) {
    return droite === undefined
      ? <View accessible accessibilityLabel={libelle || undefined} style={forme}>{corps}</View>
      : <View style={forme}>{corps}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle || undefined}
      onPress={onPress}
      android_ripple={ripple(t('ink3'))}
      style={({ pressed }: { pressed: boolean }) => [forme, isIOS && pressed ? { backgroundColor: t('fill1') } : null]}
    >
      {corps}
    </Pressable>
  );
}

/**
 * L'EN-TÊTE DE RUBRIQUE (`mm-r-h`) : capitales grises sur iOS ; sur Android, casse normale à
 * l'encre de l'espace (gris à l'accueil et dans la console).
 */
export function Rubrique({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const t = useToken();
  const teinte = useTeinte();
  const neutre = teinte.rv === t('ink');
  return (
    <View style={[{ paddingHorizontal: 4, marginTop: 22, marginBottom: 8 }, style]}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={1.4}
        style={isIOS
          ? { fontFamily: POLICE.corps, fontSize: 13, fontWeight: '700', letterSpacing: 0.26, textTransform: 'uppercase', color: t('textMuted') }
          : { fontFamily: POLICE.corps, fontSize: 14, fontWeight: '600', color: neutre ? t('textMuted') : teinte.rv2 }}
      >
        {children}
      </Text>
    </View>
  );
}
