import { Platform } from 'react-native';

/**
 * LE NOM DE FAMILLE, PAR PLATEFORME — et pourquoi les écrans ne l'écrivent plus en dur.
 *
 * Les écrans écrivaient `fontFamily: 'SchibstedGrotesk'`, sans espace. Sur Android, c'est le
 * nom de la famille XML que le greffon `expo-font` déclare, avec ses quatre graisses : tout
 * va bien. Sur iOS, c'est un ALIAS posé par `expo-font` — et un alias ne pointe que sur UN
 * fichier, la graisse régulière (`UIFont+FontFamilyAlias.swift` rend le seul nom PostScript
 * enregistré). Les 500, 600 et 700 retombaient au 400 : les boutons, les titres de ligne et
 * les nombres vérifiables n'avaient pas de graisse sur iPhone.
 *
 * La VRAIE famille — « Schibsted Grotesk », « JetBrains Mono », avec l'espace — est
 * embarquée par `UIAppFonts` avec toutes ses graisses, et iOS choisit la bonne d'après
 * `fontWeight`. C'est donc elle qu'on demande sur iOS.
 *
 * Fraunces n'a pas d'espace : son nom réel EST son alias, il se résout seul.
 */
export const POLICE = {
  affichage: 'Fraunces',
  corps: Platform.OS === 'ios' ? 'Schibsted Grotesk' : 'SchibstedGrotesk',
  mono: Platform.OS === 'ios' ? 'JetBrains Mono' : 'JetBrainsMono',
} as const;
