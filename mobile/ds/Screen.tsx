import { KeyboardAvoidingView, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Children, isValidElement, type ReactNode, type Ref } from 'react';
import { Heros, Revele } from './Pressoir';
import { haptique } from './haptique';
import { isIOS, translucentTabBar } from './platform';
import { Display } from './Type';
import { Mesh } from './Mesh';
import { NavBar } from './NavBar';
import { ThemeScope, useToken, px } from './theme';
import { EspaceScope, useTeinte, type Espace } from './espace';

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

/**
 * L'ESPACE PAR DÉFAUT D'UN TERRITOIRE — pour que les écrans qui ne le disent pas prennent quand
 * même la bonne teinte : le bleu de « je te forme » est celui d'Apprendre, le violet de
 * « je transforme » celui du Club. Un écran le précise avec `espace` quand les deux divergent
 * (l'accueil et le profil sont `hub`, l'assistant `ia`).
 */
export const ESPACE_DU_TERRITOIRE: Record<ScreenTerritory, Espace> = {
  forme: 'edu', transforme: 'club', informe: 'hub', digitalise: 'hub', nuit: 'admin',
};

export function Screen({
  territory = 'forme',
  espace,
  maillage = true,
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
  onRefresh,
  enRafraichissement,
  refDefilement,
  children,
}: {
  territory?: ScreenTerritory;
  /** L'espace du kit v4.5 (`data-space`) : la teinte d'action de l'écran. Déduit du territoire sinon. */
  espace?: Espace;
  /** `false` : surface plate, sans maillage — la console et ses états (kit v4.3, « console claire »). */
  maillage?: boolean;
  /** Écran nuit — console, /403. Ouvre une portée de thème, pas une prop passée aux enfants. */
  dark?: boolean; // ok-ds — OUVRE la portée de thème de l'écran, l'équivalent RN de `.dk` ; rien n'est passé aux enfants
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
  /** Tirer pour rafraîchir. Le contenu RESTE affiché pendant la relecture. */
  onRefresh?: () => void;
  enRafraichissement?: boolean;
  /** Pour remonter en haut quand le contenu change sur place (leçon suivante). */
  refDefilement?: Ref<ScrollView>;
  children: ReactNode;
}) {
  const corps = (
    <Corps
      maillage={maillage}
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
      onRefresh={onRefresh}
      enRafraichissement={enRafraichissement}
      refDefilement={refDefilement}
    >
      {children}
    </Corps>
  );

  const porte = <EspaceScope espace={espace ?? ESPACE_DU_TERRITOIRE[dark ? 'nuit' : territory]}>{corps}</EspaceScope>;
  return dark ? <ThemeScope scheme="dark">{porte}</ThemeScope> : porte;
}

/* Séparé pour que `useToken()` lise la portée nuit OUVERTE par `Screen`, et pas celle du
   téléphone : un hook appelé dans le composant qui pose le fournisseur ne le voit pas. */
function Corps({
  maillage, territory, retour, onRetour, titre, droite, tabbar, center, scroll, gutter, contentStyle,
  overlay, onRefresh, enRafraichissement, refDefilement, children,
}: {
  maillage: boolean;
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
  onRefresh?: () => void;
  enRafraichissement?: boolean;
  refDefilement?: Ref<ScrollView>;
  children: ReactNode;
}) {
  const t = useToken();
  const teinte = useTeinte();
  const insets = useSafeAreaInsets();
  const barre = retour !== undefined || titre !== undefined || droite !== undefined;

  /* La barre d'onglets est rendue par le routeur, PAR-DESSUS le corps. Sa hauteur et la zone
     de geste s'ajoutent : `--tabbar-h` est la barre seule, l'encoche du bas vient en plus. */
  /* ⚠️ COMPTÉ UNE SEULE FOIS. Sur Android la barre est opaque et DANS le flux : le corps
     s'arrête déjà au-dessus d'elle, zone de geste comprise. Lui ajouter sa hauteur laissait
     80 px de vide sous la dernière ligne. Sur iOS elle flotte, et le corps passe dessous. */
  const sousLaBarre = tabbar && translucentTabBar;
  const bas = (sousLaBarre ? px(t('tabbarH')) + insets.bottom : tabbar ? 0 : insets.bottom) + 24;

  const contenu: ViewStyle = {
    /* La zone sûre HAUTE est déjà creusée par l'enveloppe ci-dessous : la répéter ici la
       compterait deux fois. Ce rembourrage n'est que l'air sous la barre, ou sous l'encoche
       quand il n'y a pas de barre. */
    paddingTop: barre ? 6 : 22,
    paddingHorizontal: gutter,
    paddingBottom: bas,
    /* LA COLONNE S'ARRÊTE À 600 dp. Sur une tablette Android, une ligne de 1 100 dp ne se
       lit plus : l'œil perd le début de la suivante. Au-delà, elle se centre. */
    width: '100%',
    maxWidth: 600 + gutter * 2,
    alignSelf: 'center',
    ...(center ? { flexGrow: 1, justifyContent: 'center' } : null),
  };

  return (
    <View style={{ flex: 1, backgroundColor: territory === 'nuit' ? t('night') : t('bento2') }}>
      {maillage ? <Mesh territory={territory} /> : null}
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {barre ? (
          <NavBar
            retour={retour}
            onRetour={retour === undefined ? undefined : (onRetour ?? (() => router.back()))}
            titre={titre}
            droite={droite}
          />
        ) : null}
        {/* LE CLAVIER NE DOIT PAS CACHER CE QU'ON TAPE, NI LE BOUTON QUI L'ENVOIE. iOS ne
            redimensionne pas la fenêtre : le corps se rembourre de la hauteur du clavier, et
            le défilement suit le champ actif. Android la redimensionne déjà (`adjustResize`) :
            rejouer le décalage par-dessus ferait monter le champ deux fois trop haut. */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={isIOS ? 'padding' : undefined}>
          {scroll ? (
            <ScrollView
              ref={refDefilement}
              contentContainerStyle={[contenu, contentStyle]}
              showsVerticalScrollIndicator={false}
              /* Un appui hors champ referme le clavier, et le défilement reste possible
                 clavier ouvert. */
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets
              refreshControl={onRefresh ? (
                <RefreshControl
                  refreshing={!!enRafraichissement}
                  onRefresh={() => { haptique.selection(); onRefresh(); }}
                  tintColor={teinte.rv}
                  colors={[teinte.rv]}
                  progressBackgroundColor={t('surfacePage')}
                />
              ) : undefined}
            >
              {enCascade(children)}
            </ScrollView>
          ) : (
            <View style={[{ flex: 1 }, contenu, contentStyle]}>{children}</View>
          )}
        </KeyboardAvoidingView>
      </View>
      {/* Hors du conteneur défilant, et hors de la zone sûre haute : il se place lui-même. */}
      {overlay}
    </View>
  );
}

/**
 * ══ 380 ms — « ceci vient d'arriver » ══ — L'ENTRÉE EN CASCADE, POSÉE UNE FOIS ICI.
 *
 * Chaque bloc d'un écran défilant entre à +16 px et en opacité, 70 ms après son voisin
 * (`.rv` du kit, `--i` = sa place). « Le décalage suffit à faire lire la liste dans l'ordre,
 * sans jamais donner l'impression d'attendre » : au-delà du huitième, plus de décalage.
 *
 * Une seule fois, à l'arrivée du bloc. Un bloc qui arrive PLUS TARD — la donnée chargée qui
 * remplace son squelette — entre à son tour : c'est exactement « ceci vient d'arriver ».
 *
 * Les titres d'affichage ne sont pas enveloppés : ils ont leur propre montée sous masque
 * (`LigneDeTitre`, 700 ms). Deux mouvements sur le même titre en feraient un tic.
 * Les écrans non défilants (`scroll={false}`) gardent leur mise en page flexible intacte.
 */
function enCascade(children: ReactNode): ReactNode {
  return Children.toArray(children).map((c, i) => (
    isValidElement(c) && c.type === Display
      ? c
      : (
        <Revele
          key={isValidElement(c) && c.key !== null ? c.key : i}
          i={i}
          echelle={isValidElement(c) && c.type === Heros}
        >
          {c}
        </Revele>
      )
  ));
}
