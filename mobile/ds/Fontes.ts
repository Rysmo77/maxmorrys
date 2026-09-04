import { useEffect } from 'react';
import { useFonts } from 'expo-font';
/*
 * UNE GRAISSE PAR IMPORT, ET JAMAIS LE BARIL DU PAQUET.
 *
 * `@expo-google-fonts/fraunces` expose un baril qui fait `require()` de SES DIX-HUIT fichiers,
 * italiques et graisses inutilisées comprises. Metro suit les `require`, pas les besoins : le
 * baril embarque tout. Mesuré sur ce port — 47 `.ttf` dans le paquet Android là où neuf
 * suffisent, environ 4,5 Mo de fontes que rien n'affichera jamais.
 *
 * Le défaut est invisible : le typecheck passe, le bundle se construit, l'application marche.
 * Seule la liste des ressources exportées le montre. `mobile-fontes.test.ts` garde la règle.
 */
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Fraunces_900Black } from '@expo-google-fonts/fraunces/900Black';
import { SchibstedGrotesk_400Regular } from '@expo-google-fonts/schibsted-grotesk/400Regular';
import { SchibstedGrotesk_500Medium } from '@expo-google-fonts/schibsted-grotesk/500Medium';
import { SchibstedGrotesk_600SemiBold } from '@expo-google-fonts/schibsted-grotesk/600SemiBold';
import { SchibstedGrotesk_700Bold } from '@expo-google-fonts/schibsted-grotesk/700Bold';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';

/**
 * LES FONTES DE MARQUE — la table, et le chargement.
 *
 * `Type.tsx` documentait la dette depuis le premier jour du port : trente-neuf fichiers
 * écrivent `fontFamily: 'Fraunces'`, `'SchibstedGrotesk'` ou `'JetBrainsMono'`, et AUCUNE
 * des trois n'était chargée. React Native ne se plaint pas d'une famille inconnue — il
 * retombe sur la police système, en silence. L'application était lisible et hors marque,
 * sur chaque écran, sans qu'aucune porte ne le voie.
 *
 * ── LA TABLE FAIT AUTORITÉ, ET ELLE VIENT DU WEB ────────────────────────────────────────
 *
 * Les graisses ci-dessous sont une transcription de `src/design-system/css/tokens/fonts.css`,
 * qui est une copie LITTÉRALE du kit (`ds:check` échoue si elle s'en écarte d'un octet) :
 *
 *     Fraunces           400 700 900
 *     Schibsted Grotesk  400 500 600 700
 *     JetBrains Mono     400 700
 *
 * `tests/unit/mobile-fontes.test.ts` relit les deux côtés et refuse toute divergence. C'est
 * la seule chose qui empêche le natif et le web de dériver : l'écart ne se voit sur aucune
 * capture, il se lit en superposant deux écrans.
 *
 * La table vit dans `ds/` et non à la racine parce que c'est le SYSTÈME qui décide de la
 * typographie. La racine ne fait que l'attendre.
 *
 * ── LES NOMS SANS ESPACE NE SONT PAS UNE COQUETTERIE ─────────────────────────────────────
 *
 * Les vraies familles s'appellent « Fraunces », « Schibsted Grotesk » et « JetBrains Mono ».
 * Les trente-neuf fichiers, eux, écrivent `SchibstedGrotesk` et `JetBrainsMono`, sans espace.
 * Ce sont donc des ALIAS : `expo-font` enregistre chaque fichier sous le nom qu'on lui donne,
 * et ce nom est ce que React Native cherchera. Renommer ici casserait trente-neuf fichiers en
 * silence — la police système reviendrait, sans erreur ni avertissement.
 *
 * ── DEUX MÉCANISMES, ET CHACUN FAIT CE QUE L'AUTRE NE SAIT PAS FAIRE ────────────────────
 *
 * Ce module n'est que la MOITIÉ du chargement. L'autre moitié est le greffon `expo-font`
 * déclaré dans `app.json`, qui lie les neuf fichiers de `assets/fonts/` au projet natif. Les
 * deux sont nécessaires, et aucun ne remplace l'autre :
 *
 *   · ANDROID — le greffon écrit une famille XML par nom, avec un `app:fontWeight` par
 *     graisse, et l'enregistre par `ReactFontManager.addCustomFont`. `getTypeface` consulte
 *     ce cache-là EN PREMIER, donc `fontWeight: '900'` rend bien la Fraunces Black.
 *     Le chargement à l'exécution, lui, ne remplit que la case NORMAL : tout `fontWeight`
 *     ≥ 700 y retombait sur `Typeface.create(nom, BOLD)`, c'est-à-dire la POLICE SYSTÈME
 *     graissée — donc TOUTE la Fraunces, qui n'est jamais demandée en dessous de 700, plus
 *     `Button` et `Num`. Sur Android, c'est le greffon qui rend les graisses.
 *   · iOS — le greffon embarque les fichiers par `UIAppFonts`, sous leur VRAIE famille :
 *     « Fraunces », mais aussi « Schibsted Grotesk » et « JetBrains Mono », AVEC l'espace.
 *     Or les écrans écrivent `SchibstedGrotesk`. C'est ce module-ci qui pose l'alias, et
 *     sans lui `fontNamesForFamilyName('SchibstedGrotesk')` ne rend rien : la police système
 *     revient. Fraunces, dont le vrai nom n'a pas d'espace, se résout sans alias — ses trois
 *     graisses comprises.
 *
 * Ils cohabitent sans conflit, et c'est LU, pas supposé : `CTFontManagerRegisterFontsForURL`
 * répond `duplicatedName` quand le fichier est déjà embarqué, et `expo-font` ignore
 * explicitement ce cas (`ios/FontUtils.swift`, `registerFont`). Le prix de la cohabitation
 * est le POIDS — sur Android les mêmes octets partent deux fois, une fois dans `res/font` et
 * une fois dans les ressources du paquet JS, soit environ 848 Ko.
 *
 * CE QUI RESTE APPROXIMÉ, et il faut le savoir : sur iOS, les deux familles dont le vrai nom
 * porte une espace passent par l'alias, qui ne rend QU'UNE fonte. Leurs 500/600/700 s'y
 * ramènent au 400. Le fermer demanderait de renommer la famille dans les trente-neuf
 * fichiers, ce qui est un tout autre chantier.
 *
 * ── LES BINAIRES SONT DANS LE DÉPÔT, ET LA DÉRIVE EST GARDÉE ────────────────────────────
 *
 * `mobile/assets/fonts/` porte les neuf `.ttf`, copiés des paquets `@expo-google-fonts/*`.
 * C'est une SECONDE SOURCE, assumée plutôt que subie : le greffon ne sait lire que des
 * chemins de fichiers, et sans lui les graisses d'Android restent fausses.
 *
 * Ce que l'interdit d'origine protégeait — deux copies qui dérivent — est repris par
 * `mobile-fontes.test.ts`, qui n'en croit pas les noms de fichiers : il lit la table `OS/2`
 * et la table `name` de chaque binaire. Un fichier qui n'est pas ce que son nom annonce ne
 * passe pas, et quand les paquets sont installés la copie est comparée octet par octet.
 */

/**
 * La graisse « nue » : celle enregistrée sous le nom de famille seul, donc celle que rendra
 * `fontFamily: 'SchibstedGrotesk'` sans `fontWeight`. C'est le régulier, comme au web.
 */
export const GRAISSE_BASE = 400;

/** Une famille de marque, telle que les écrans l'écrivent. */
export type Famille = keyof typeof FONTES;

/**
 * Les trois familles et leurs graisses. Toute modification ici doit passer par `fonts.css` —
 * c'est le kit qui décide, pas le port natif.
 */
export const FONTES = {
  Fraunces: {
    400: Fraunces_400Regular,
    700: Fraunces_700Bold,
    900: Fraunces_900Black,
  },
  SchibstedGrotesk: {
    400: SchibstedGrotesk_400Regular,
    500: SchibstedGrotesk_500Medium,
    600: SchibstedGrotesk_600SemiBold,
    700: SchibstedGrotesk_700Bold,
  },
  JetBrainsMono: {
    400: JetBrainsMono_400Regular,
    700: JetBrainsMono_700Bold,
  },
} as const;

/**
 * La carte remise à `expo-font` : une entrée par fichier.
 *
 * La graisse de base prend le nom de famille NU — c'est lui, et lui seul, que les écrans
 * citent. Les autres graisses prennent `Famille_graisse` : ce nom n'est écrit nulle part
 * ailleurs et ne doit pas l'être. Il existe pour que le fichier soit enregistré auprès du
 * système, ce qui suffit à iOS pour retrouver la bonne graisse dans la vraie famille.
 */
const table: Record<string, Record<string, number>> = FONTES;
const carte: Record<string, number> = {};
for (const [famille, graisses] of Object.entries(table)) {
  for (const [graisse, source] of Object.entries(graisses)) {
    carte[Number(graisse) === GRAISSE_BASE ? famille : `${famille}_${graisse}`] = source;
  }
}
export const CARTE_DES_FONTES: Record<string, number> = carte;

/**
 * Vrai quand les fontes ne sont plus une raison d'attendre.
 *
 * Deux façons d'y arriver, et c'est délibéré : les fontes sont prêtes, OU leur chargement a
 * échoué. Un échec ne doit pas laisser l'application sur un écran de lancement qui ne part
 * jamais — une police de repli se voit, un démarrage bloqué ne se répare pas. L'échec est
 * donc journalisé, et le rendu a lieu quand même.
 */
export function useFontesChargees(): boolean {
  const [chargees, erreur] = useFonts(CARTE_DES_FONTES);

  useEffect(() => {
    if (!erreur) return;
    // « Ne pas retomber sur une police système sans le dire » : voilà, c'est dit.
    console.warn(
      '[fontes] Le chargement des fontes de marque a échoué. L’application rend en police '
        + 'système : lisible, hors marque. Familles attendues : '
        + Object.keys(FONTES).join(', ') + '.',
      erreur,
    );
  }, [erreur]);

  return chargees || erreur !== null;
}
