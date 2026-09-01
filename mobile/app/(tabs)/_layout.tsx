import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, navBarElevation, px, translucentTabBar, useScheme, useToken, useTutorNom } from '../../ds';

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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t('ink'),
        tabBarInactiveTintColor: t('ink3'),
        tabBarStyle: {
          height: height + insets.bottom,
          paddingBottom: insets.bottom,
          /* Opaque sur Android — la surface de la page, pas le fond translucide de la
             barre — et l'élévation prend le relais du filet pour détacher la barre. */
          backgroundColor: translucentTabBar ? t('tabbarBg') : t('surfacePage'),
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
              style={StyleSheet.absoluteFill}
            />
          )
          : undefined,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Espace', tabBarIcon: ({ color }) => <Icon name="home" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="cours"
        options={{ title: 'Cours', tabBarIcon: ({ color }) => <Icon name="book" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="repetiteur"
        options={{ title: tuteur, tabBarIcon: ({ color }) => <Icon name="chat" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="club"
        options={{ title: 'Club', tabBarIcon: ({ color }) => <Icon name="users" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <Icon name="user" size={21} color={color} /> }}
      />
    </Tabs>
  );
}
