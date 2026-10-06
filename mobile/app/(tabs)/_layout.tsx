import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COURBE, Icon, isAndroid, navBarElevation, px, translucentTabBar, useBascule, useMouvement,
  useScheme, useToken, useTutorNom, veil, type IconName, POLICE,
} from '../../ds';

/**
 * ── LA BARRE D'ONGLETS ────────────────────────────────────────────────────────────────
 *
 * Cinq onglets, et le kit les nomme sans ambiguïté (`ScreensSpace.js`, `mmTabItems`) :
 * **Espace · Cours · {tutorNom()} · Club · Profil**.
 *
 * LE TROISIÈME PORTE UN NOM QUI N'EST PAS À NOUS. `tutorNom()` renvoie « Répétiteur » par
 * défaut, mais une personne peut renommer son tuteur — et c'est alors SON nom qui doit
 * s'afficher dans SA barre. Écrire « Rysmo » ici casserait ce renommage, et confondrait au
 * passage deux choses que l'architecture de marque sépare : « Rysmo » nomme CETTE
 * APPLICATION, « Répétiteur » nomme le tuteur qu'elle contient.
 *
 * LA HAUTEUR VIENT DU JETON, LA ZONE SÛRE S'Y AJOUTE. `--tabbar-h` est la hauteur de la
 * barre elle-même ; l'encoche du bas des iPhone récents vient EN PLUS. Les confondre écrase
 * la dernière rangée d'icônes sous la barre système — c'est le même calcul que la version
 * web fait dans `AppBottomNav`.
 *
 * LE FLOU EST PERMIS ICI, ET SEULEMENT ICI (règle 1) : une barre d'onglets est du chrome
 * FIXE. Il est posé par `expo-blur` sur `tabBarBackground`, pas par une opacité de fond —
 * un fond translucide sans flou laisse voir le texte qui passe dessous, ce qui est
 * exactement ce que la règle veut éviter.
 *
 * ⚠️ ET IL N'ÉTAIT PAS POSÉ. Ce commentaire décrivait un `tabBarBackground` en `expo-blur`
 * qui n'existait nulle part dans le fichier : la barre n'avait qu'un `backgroundColor`.
 * Or `--tabbar-bg` vaut `rgba(255,255,255,.62)` en clair et `rgba(13,17,23,.72)` en nuit —
 * TRANSLUCIDE. La barre laissait donc voir le texte défiler dessous, sans le flouter :
 * précisément le défaut que la règle 1 nomme, dans le fichier qui prétendait l'éviter.
 *
 * ── ET LE FLOU NE VAUT QUE SUR iOS ────────────────────────────────────────────────────
 * Le flou translucide est une CONVENTION iOS : le contenu glisse dessous et transparaît.
 * Une barre de navigation Material 3 est OPAQUE et se détache par son élévation. Garder
 * le flou sur Android n'était pas seulement étranger au système : c'était une couche de
 * composition payée pour rien sur un appareil à 2 Go — exactement le coût que la règle 1
 * existe pour surveiller.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function TabsLayout() {
  const t = useToken();
  const scheme = useScheme();
  /* `useTutorNom()` et non `tutorNom()` : la barre doit se redessiner quand quelqu'un
     renomme son tuteur depuis l'écran de mémoire. Avec l'accesseur simple, elle gardait
     l'ancien nom jusqu'au prochain rendu — et affichait donc « Répétiteur » sous un écran
     qui venait d'afficher « Coach ». */
  const tuteur = useTutorNom();
  const insets = useSafeAreaInsets();
  const height = px(t('tabbarH'));
  const { reduit } = useMouvement();
  /* L'onglet actif prend l'encre de SON territoire — bleu pour les cours, violet ailleurs. */
  const bleu = t('mmBleu');
  const violet = t('mmVioletT');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        /* CHANGER D'ONGLET — fondu croisé de 180 ms, AUCUNE translation (planche des
           transitions) : « une barre d'onglets qui fait glisser latéralement crée une
           géographie fausse ». Les onglets sont cinq entrées d'un même niveau. */
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: reduit ? 0 : 180, easing: COURBE.standard } },
        tabBarActiveTintColor: t('ink'),
        tabBarInactiveTintColor: t('ink3'),
        /* Sur Android la fenêtre se redimensionne avec le clavier : sans ça, la barre
           d'onglets remonte au-dessus de lui et mange la place du champ. */
        tabBarHideOnKeyboard: isAndroid,
        tabBarStyle: {
          /*
            ⚠️ LE FLOU N'AVAIT RIEN À FLOUTER. La barre n'était pas en position absolue : le
            contenu s'arrêtait AU-DESSUS d'elle, et les écrans ajoutaient encore sa hauteur
            en marge — la dernière rangée flottait à 80 px du bas sur Android. Absolue sur
            iOS (le contenu glisse dessous, `Screen tabbar` le rembourre) ; dans le flux sur
            Android, où elle est opaque et où le rembourrage n'a donc pas lieu d'être.
          */
          position: translucentTabBar ? 'absolute' : 'relative',
          height: height + insets.bottom,
          paddingBottom: insets.bottom,
          /* Opaque sur Android — la surface de la page, pas le fond translucide de la
             barre — et l'élévation prend le relais du filet pour détacher la barre. */
          backgroundColor: translucentTabBar ? 'transparent' : t('surfacePage'),
          borderTopColor: t('tabbarBrd'),
          borderTopWidth: translucentTabBar ? 1 : 0,
          elevation: navBarElevation,
        },
        /* Le flou promis, enfin posé — et seulement là où la convention l'attend.
           `intensity: 24` reprend les 24–26 px du système, comme `ds/Surface`. */
        tabBarBackground: translucentTabBar
          ? () => (
            <BlurView
              intensity={24}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { backgroundColor: t('tabbarBg') }]}
            />
          )
          : undefined,
        tabBarLabelStyle: { fontFamily: POLICE.corps, fontSize: 11.5, fontWeight: '600' },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="espace"
        options={{ title: 'Espace', tabBarActiveTintColor: violet, tabBarIcon: ({ focused }) => <IconeOnglet nom="home" actif={focused} teinte={violet} /> }}
      />
      <Tabs.Screen
        name="cours"
        options={{ title: 'Cours', tabBarActiveTintColor: bleu, tabBarIcon: ({ focused }) => <IconeOnglet nom="book" actif={focused} teinte={bleu} /> }}
      />
      <Tabs.Screen
        name="repetiteur"
        options={{ title: tuteur, tabBarActiveTintColor: violet, tabBarIcon: ({ focused }) => <IconeOnglet nom="chat" actif={focused} teinte={violet} /> }}
      />
      <Tabs.Screen
        name="club"
        options={{ title: 'Club', tabBarActiveTintColor: violet, tabBarIcon: ({ focused }) => <IconeOnglet nom="users" actif={focused} teinte={violet} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarActiveTintColor: violet, tabBarIcon: ({ focused }) => <IconeOnglet nom="user" actif={focused} teinte={violet} /> }}
      />
    </Tabs>
  );
}

/**
 * L'ICÔNE D'ONGLET — 220 ms, « l'état a changé ».
 *
 * Deux icônes superposées, l'une à l'encre neutre, l'autre à la teinte du territoire, en
 * fondu croisé : une couleur ne s'anime pas sur le pilote natif. Sur Android, la pilule
 * d'indicateur de Material 3 s'ouvre derrière l'icône active.
 *
 * L'onglet du répétiteur garde son glyphe de bulle : l'onde vit dans SON écran, pas dans la
 * barre, où elle deviendrait une boucle permanente sans attente derrière.
 */
function IconeOnglet({ nom, actif, teinte }: { nom: IconName; actif: boolean; teinte: string }) {
  const t = useToken();
  const b = useBascule(actif);
  return (
    <View style={{ width: 56, height: 30, alignItems: 'center', justifyContent: 'center' }}>
      {isAndroid ? (
        <Animated.View
          style={{
            position: 'absolute', width: 56, height: 30, borderRadius: 15,
            backgroundColor: veil(teinte, 0.16),
            opacity: b, transform: [{ scaleX: b.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}
        />
      ) : null}
      <Animated.View style={{ opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
        <Icon name={nom} size={21} color={t('ink3')} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: b }}>
        <Icon name={nom} size={21} color={teinte} />
      </Animated.View>
    </View>
  );
}
