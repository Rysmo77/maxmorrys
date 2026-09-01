import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, px, useToken, useTutorNom } from '../../ds';

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
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function TabsLayout() {
  const t = useToken();
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
          backgroundColor: t('tabbarBg'),
          borderTopColor: t('tabbarBrd'),
          borderTopWidth: 1,
        },
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
