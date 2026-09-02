import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Mesh } from './Mesh';
import { NavBar } from './NavBar';
import { ThemeScope, useToken, px } from './theme';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CHÂSSIS. Un corps, deux plateformes.
 *
 * C'est la transposition de `NativeScreen` du transfert, et c'est la pièce qui fait tenir sa
 * thèse : **le contenu d'un écran est écrit UNE fois** ; seuls le maillage, les zones sûres et
 * la barre haute changent d'une plateforme à l'autre, et ils changent ICI.
 *
 * TROIS CHOSES QUE CE COMPOSANT PORTE, ET QU'UN ÉCRAN NE DOIT PLUS ÉCRIRE :
 *
 * 1 · LA ZONE SÛRE. Le kit code `47 / 34` et `24 / 24` parce qu'il simule deux appareils dans
 *     un cadre fixe. En vrai, elle se DEMANDE — `useSafeAreaInsets()` — et elle vaut 0 sur un
 *     appareil sans encoche. Recopier 47 px reviendrait à creuser un trou sur un Pixel 4a.
 *
 * 2 · LE REMBOURRAGE BAS SOUS LA BARRE D'ONGLETS. `tabbar` ajoute `--tabbar-h` + la zone de
 *     geste. Sans lui, les trois dernières lignes de chaque écran d'onglet vivent sous la
 *     barre : elles existent, on ne peut pas les toucher.
 *
 * 3 · LE MODE NUIT LOCAL. `dark` ouvre une portée de thème, l'équivalent natif du `.dk` du
 *     web : la console et le /403 sont sombres SUR UN TÉLÉPHONE EN MODE CLAIR. Sans portée,
 *     leurs textes prendraient l'encre claire sur un fond nuit.
 *
 * ── UNE SEULE DÉCLARATION DE REMBOURRAGE ──────────────────────────────────────────────
 * Le transfert consacre une section entière à ce défaut : `paddingTop` PUIS `padding` dans le
 * même objet, et la dernière clé gagne — le décalage devient du code mort, sans avertissement.
 * Il a coûté 35 % du lecteur de l'écran verrouillé. Ici, `contentContainerStyle` reçoit un
 * objet unique, composé une seule fois, et aucun écran n'y ajoute de `padding`.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export type ScreenTerritory = 'forme' | 'informe' | 'transforme' | 'digitalise' | 'nuit';

export function Screen({
  territory = 'forme',
  dark,
  retour,
  onRetour,
  titre,
  droite,
  tabbar,
  center,
  scroll = true,
  gutter = 18,
  contentStyle,
  overlay,
  children,
}: {
  territory?: ScreenTerritory;
  /** Écran nuit — console, /403. Ouvre une portée de thème, pas une prop passée aux enfants. */
  dark?: boolean;
  /** Libellé de retour. Affiché sur iOS, dit à voix haute sur Android. */
  retour?: string;
  /** Par défaut `router.back()`. Le préciser sert quand le retour saute une étape. */
  onRetour?: () => void;
  titre?: string;
  droite?: ReactNode;
  /** L'écran vit sous la barre d'onglets : son corps se rembourre en conséquence. */
  tabbar?: boolean;
  /** Corps centré verticalement — les écrans d'état, de succès, de permission. */
  center?: boolean;
  scroll?: boolean;
  gutter?: number;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * CE QUI FLOTTE AU-DESSUS DU CORPS — bouton flottant, mini-lecteur.
   *
   * Il DOIT passer par ici et pas dans `children` : un enfant du corps vit dans le conteneur
   * DÉFILANT, donc un `position:absolute` s'y résout par rapport au CONTENU, pas à l'écran —
   * le bouton s'en va vers le haut au premier glissement, et il ne revient qu'en remontant.
   * C'est le pendant exact du piège de `safeBottom` sur la barre d'onglets.
   */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const corps = (
    <Corps
      territory={dark ? 'nuit' : territory}
      retour={retour}
      onRetour={onRetour}
      titre={titre}
      droite={droite}
      tabbar={tabbar}
      center={center}
      scroll={scroll}
      gutter={gutter}
      contentStyle={contentStyle}
      overlay={overlay}
    >
      {children}
    </Corps>
  );

  return dark ? <ThemeScope scheme="dark">{corps}</ThemeScope> : corps;
}

/* Séparé pour que `useToken()` lise la portée nuit OUVERTE par `Screen`, et pas celle du
   téléphone : un hook appelé dans le composant qui pose le fournisseur ne le voit pas. */
function Corps({
  territory, retour, onRetour, titre, droite, tabbar, center, scroll, gutter, contentStyle,
  overlay, children,
}: {
  territory: ScreenTerritory;
  retour?: string;
  onRetour?: () => void;
  titre?: string;
  droite?: ReactNode;
  tabbar?: boolean;
  center?: boolean;
  scroll: boolean;
  gutter: number;
  contentStyle?: StyleProp<ViewStyle>;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const barre = retour !== undefined || titre !== undefined || droite !== undefined;

  /* La barre d'onglets est rendue par le routeur, PAR-DESSUS le corps. Sa hauteur et la zone
     de geste s'ajoutent : `--tabbar-h` est la barre seule, l'encoche du bas vient en plus. */
  const bas = (tabbar ? px(t('tabbarH')) : 0) + insets.bottom + 24;

  const contenu: ViewStyle = {
    /* La zone sûre HAUTE est déjà creusée par l'enveloppe ci-dessous : la répéter ici la
       compterait deux fois. Ce rembourrage n'est que l'air sous la barre, ou sous l'encoche
       quand il n'y a pas de barre. */
    paddingTop: barre ? 6 : 22,
    paddingHorizontal: gutter,
    paddingBottom: bas,
    ...(center ? { flexGrow: 1, justifyContent: 'center' } : null),
  };

  return (
    <View style={{ flex: 1, backgroundColor: territory === 'nuit' ? t('night') : t('surfacePage') }}>
      <Mesh territory={territory} />
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {barre ? (
          <NavBar
            retour={retour}
            onRetour={retour === undefined ? undefined : (onRetour ?? (() => router.back()))}
            titre={titre}
            droite={droite}
          />
        ) : null}
        {scroll ? (
          <ScrollView
            contentContainerStyle={[contenu, contentStyle]}
            showsVerticalScrollIndicator={false}
            /* Le clavier ne doit pas cacher ce qu'on tape : un appui hors champ le referme,
               et le défilement reste possible clavier ouvert. */
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contenu, contentStyle]}>{children}</View>
        )}
      </View>
      {/* Hors du conteneur défilant, et hors de la zone sûre haute : il se place lui-même. */}
      {overlay}
    </View>
  );
}
