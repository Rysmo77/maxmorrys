import {
  AccessibilityInfo, Animated, Text, TextInput, View,
  type KeyboardTypeOptions, type ReturnKeyTypeOptions, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { COURBE, DUREE, duree, useBascule, useMouvement } from './mouvement';
import { POLICE } from './police';
import { useToken, px } from './theme';

/**
 * LE CHAMP — un VRAI contrôle, et c'est le point.
 *
 * Le transfert nomme ce manque comme l'un de ses trois points BLOQUANTS : « `Field` rend un
 * `<div>`, pas un `<input>` […] rien n'est atteignable au clavier ni annoncé par un lecteur
 * d'écran, et aucun clavier mobile adapté ne s'ouvre. » Le dernier point est le plus concret
 * ici : sur natif, `keyboardType` décide de ce qui s'ouvre sous le doigt.
 *
 * D'où `keyboardType` et `textContentType` exposés. Sans eux, quelqu'un qui tape son numéro
 * Wave au tunnel reçoit un clavier alphabétique — trente secondes de saisie en plus sur un
 * écran de paiement, sur le marché même que ce produit vise.
 *
 * L'ERREUR VA SOUS LE CHAMP, en clair, et SANS SECOUSSE : « elle ajoute du stress et ne dit
 * pas ce qui est faux ».
 */
export function Field({
  label, value, onChangeText, placeholder, hint, error, multiline,
  keyboardType, textContentType, secureTextEntry, autoCapitalize = 'none', trailing, style,
  ref, autoComplete, autoCorrect, autoFocus, returnKeyType, onSubmitEditing, maxLength, editable,
}: {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  hint?: string;
  /** Message d'erreur. Sa présence SUFFIT à mettre le champ en erreur. */
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  textContentType?: TextInputProps['textContentType'];
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Pour chaîner les champs : « Suivant » sur le clavier donne le focus au champ d'après. */
  ref?: Ref<TextInput>;
  /** Le remplissage automatique du système — e-mail, mot de passe, code reçu. */
  autoComplete?: TextInputProps['autoComplete'];
  autoCorrect?: boolean;
  autoFocus?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  maxLength?: number;
  editable?: boolean;
}) {
  const t = useToken();
  const bad = !!error;
  /* LE FOCUS SE VOIT. Le champ actif ne se distinguait des autres que par son curseur — à
     peine visible en plein soleil. La bordure passe à l'encre, en fondu (une couleur de
     bordure ne s'anime pas sur le pilote natif : c'est une couche par-dessus). */
  const [focus, setFocus] = useState(false);
  const anneau = useBascule(focus && !bad);

  return (
    <View style={[{ marginTop: 14 }, style]}>
      <Text
        maxFontSizeMultiplier={1.6}
        style={{
          fontFamily: POLICE.corps, fontSize: 12.5, fontWeight: '600',
          color: t('textMuted'), marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: 10,
        minHeight: multiline ? 96 : 54,
        paddingHorizontal: 16, paddingTop: multiline ? 14 : 0,
        borderRadius: px(t('rM')),
        backgroundColor: t('fieldBg'),
        borderWidth: 1.5,
        borderColor: bad ? t('stop') : t('borderField'),
      }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: -1.5, right: -1.5, bottom: -1.5, left: -1.5,
            borderRadius: px(t('rM')), borderWidth: 1.5, borderColor: t('ink'), opacity: anneau,
          }}
        />
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t('textFaint')}
          multiline={multiline}
          keyboardType={keyboardType}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          submitBehavior={onSubmitEditing && !multiline ? 'submit' : undefined}
          maxLength={maxLength}
          editable={editable}
          maxFontSizeMultiplier={1.8}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1, fontFamily: POLICE.corps, fontSize: 15, color: t('textBody'),
            paddingVertical: multiline ? 0 : 14,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {trailing}
      </View>
      {/* L'erreur apparaît en FONDU, 220 ms — « pas de secousse : une secousse ajoute du stress
          à un moment déjà raté, et elle ne dit pas ce qui est faux. Le message le dit. » */}
      {error ? (
        <MessageDErreur texte={error} />
      ) : hint ? (
        <Text maxFontSizeMultiplier={1.8} style={{ fontFamily: POLICE.corps, fontSize: 11.5, marginTop: 6, color: t('textMuted') }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function MessageDErreur({ texte }: { texte: string }) {
  const t = useToken();
  const { reduit } = useMouvement();
  const p = useRef(new Animated.Value(reduit ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration: duree(DUREE.ui, reduit), easing: COURBE.standard, useNativeDriver: true }).start();
  }, [p, reduit]);
  /* Une erreur qui apparaît sans être annoncée n'existe pas pour un lecteur d'écran. */
  useEffect(() => { AccessibilityInfo.announceForAccessibility(texte); }, [texte]);
  return (
    <Animated.Text
      accessibilityLiveRegion="polite"
      maxFontSizeMultiplier={1.8}
      style={{ fontFamily: POLICE.corps, fontSize: 12, marginTop: 6, color: t('stop'), opacity: p }}
    >
      {texte}
    </Animated.Text>
  );
}

