import { Text, type AccessibilityRole, type StyleProp, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';
import { POLICE } from './police';
import { useToken } from './theme';

/**
 * ══ LA PRIMITIVE DE TEXTE — treize rôles, et plus de `fontSize` écrit à la main. ══
 *
 * L'audit du 05/10/2026 a compté 262 `fontSize` en dur dans les écrans, et quatorze tailles
 * distinctes entre 9,5 et 15,5. Chacune avait sa raison locale ; ensemble, elles faisaient une
 * échelle que personne n'avait décidée. Un rôle porte la taille, l'interligne, la famille, la
 * graisse par défaut ET le plafond de police système — les cinq décisions qu'un `fontSize`
 * isolé laissait chaque fois à refaire.
 *
 *   rôle         taille / interligne   famille                plafond
 *   title        19 / 1,2              Schibsted 600          1,5
 *   headline     16 / 1,3              Schibsted 600          1,6
 *   body         15 / 1,45             Schibsted 400          2,0
 *   prose        15,5 / 1,68           Schibsted 400          2,0     (le texte d'une leçon)
 *   callout      14 / 1,45             Schibsted 400          2,0
 *   meta         13 / 1,4              Schibsted 400          1,8
 *   caption      12,5 / 1,4            Schibsted 400          1,8
 *   small        11,5 / 1,35           Schibsted 500          1,6     (le plancher du texte)
 *   eyebrow      10,5, capitales       JetBrains 400          1,4
 *   num          hérite du rôle        JetBrains 700          —
 *
 * Les titres d'affichage restent `Display` (Fraunces 900, lignes décidées à l'écriture).
 *
 * `tone` ne propose PAS `faint` : l'encre tertiaire ne porte pas de texte (AD-18).
 */
export type RoleTexte = 'title' | 'headline' | 'body' | 'prose' | 'callout' | 'meta' | 'caption' | 'small' | 'eyebrow';
export type TonTexte = 'body' | 'muted' | 'link' | 'ok' | 'warn' | 'stop' | 'onArt';

const ROLES: Record<RoleTexte, { taille: number; interligne: number; graisse: TextStyle['fontWeight']; plafond: number; mono?: boolean }> = {
  title: { taille: 19, interligne: 1.2, graisse: '600', plafond: 1.5 },
  headline: { taille: 16, interligne: 1.3, graisse: '600', plafond: 1.6 },
  body: { taille: 15, interligne: 1.45, graisse: '400', plafond: 2 },
  prose: { taille: 15.5, interligne: 1.68, graisse: '400', plafond: 2 },
  callout: { taille: 14, interligne: 1.45, graisse: '400', plafond: 2 },
  meta: { taille: 13, interligne: 1.4, graisse: '400', plafond: 1.8 },
  caption: { taille: 12.5, interligne: 1.4, graisse: '400', plafond: 1.8 },
  small: { taille: 11.5, interligne: 1.35, graisse: '500', plafond: 1.6 },
  eyebrow: { taille: 10.5, interligne: 1.3, graisse: '400', plafond: 1.4, mono: true },
};

export function Texte({
  variant = 'body', tone = 'body', weight, num, header, numberOfLines, selectable, style, children,
}: {
  variant?: RoleTexte;
  tone?: TonTexte;
  weight?: TextStyle['fontWeight'];
  /** Un nombre vérifiable : JetBrains Mono 700, chiffres tabulaires. Sa provenance passe par `Num`. */
  num?: boolean;
  /** Annoncé comme un titre par les lecteurs d'écran. */
  header?: boolean;
  numberOfLines?: number;
  selectable?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  const t = useToken();
  const r = ROLES[variant];
  const encre = {
    body: t('textBody'), muted: t('textMuted'), link: t('mmBleu'), ok: t('ok'), warn: t('warn'), stop: t('stop'), onArt: t('paperFixed'),
  }[tone];
  const role: AccessibilityRole | undefined = header ? 'header' : undefined;
  return (
    <Text
      accessibilityRole={role}
      numberOfLines={numberOfLines}
      selectable={selectable}
      maxFontSizeMultiplier={r.plafond}
      style={[{
        fontFamily: num || r.mono ? POLICE.mono : POLICE.corps,
        fontSize: r.taille,
        lineHeight: Math.round(r.taille * r.interligne),
        fontWeight: num ? '700' : weight ?? r.graisse,
        fontVariant: num ? ['tabular-nums'] : undefined,
        color: encre,
        ...(variant === 'eyebrow' ? { textTransform: 'uppercase', letterSpacing: 1.5 } : null),
      }, style]}
    >
      {children}
    </Text>
  );
}
