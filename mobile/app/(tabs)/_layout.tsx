import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COURBE, Icon, isAndroid, isIOS, navBarElevation, px, translucentTabBar, useBascule, useMouvement,
  useScheme, useTeinteDe, useToken, useTutorNom, veil, type Espace, type IconName, POLICE,
} from '../../ds';

/**
 * ── LA BARRE D'ONGLETS ────────────────────────────────────────────────────────────────
 *
 * Cinq onglets, dans l'ordre du kit v4.5 (`mm-r__tabs`) :
 * **Accueil · Apprendre · Club · {tutorNom()} · Profil**. Les ROUTES gardent leurs noms
 * (`espace`, `cours`, `repetiteur`…) : ce sont des adresses, et des liens profonds y pointent.
 * Chaque onglet actif prend la teinte de SON espace (`data-space`) : encre pour l'accueil et
 * le profil, bleu pour Apprendre, violet pour le Club et l'assistant.
 *
 * L'ONGLET DE L'ASSISTANT PORTE UN NOM QUI N'EST PAS À NOUS. `tutorNom()` renvoie « Répétiteur » par
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
  const hub = useTeinteDe('hub').rv;
  const edu = useTeinteDe('edu').rv;
  const club = useTeinteDe('club').rv;
  /* Material 3 : l'onglet actif garde l'ENCRE, c'est la pastille qui porte la teinte. */
  const actif = (teinte: string) => (isAndroid ? t('ink') : teinte);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        /* Les onglets ne glissent pas (`02-mouvement`, transitions) : « une barre d'onglets qui
           fait glisser latéralement crée une géographie fausse ». Cinq entrées d'un même niveau. */
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: reduit ? 0 : 180, easing: COURBE.standard } },
        tabBarInactiveTintColor: isAndroid ? t('textMuted') : t('ink3'),
        /* Sur Android le clavier redimensionne la fenêtre : sans ceci, la barre d'onglets
           remonte au-dessus de lui et mange la place du champ. */
        tabBarHideOnKeyboard: isAndroid,
        tabBarStyle: {
          /* ⚠️ Absolue sur iOS (le contenu glisse dessous, `Screen tabbar` le rembourre) ;
             dans le flux sur Android, où elle est opaque. Voir l'en-tête. */
          position: translucentTabBar ? 'absolute' : 'relative',
          height: height + insets.bottom,
          paddingTop: isAndroid ? 10 : 6,
          paddingBottom: insets.bottom + (isAndroid ? 4 : 0),
          /* `mm-r__tabs` : blanc à 94 % sur iOS, posé sur le flou ; surface pleine sur
             Android, détachée par l'élévation plutôt que par un filet. */
          backgroundColor: translucentTabBar ? 'transparent' : t('surfacePage'),
          borderTopColor: t('line'),
          borderTopWidth: translucentTabBar ? 1 : 0,
          elevation: navBarElevation,
        },
        tabBarBackground: translucentTabBar
          ? () => (
            <BlurView
              intensity={24}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { backgroundColor: veil(t('surfacePage'), 0.94) }]}
            />
          )
          : undefined,
        tabBarLabelStyle: isIOS
          ? { fontFamily: POLICE.corps, fontSize: 11.5, fontWeight: '500', marginTop: 1 }
          : { fontFamily: POLICE.corps, fontSize: 12, fontWeight: '600', marginTop: 4 },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="espace"
        options={{ title: 'Accueil', tabBarActiveTintColor: actif(hub), tabBarIcon: ({ focused }) => <IconeOnglet nom="home" actif={focused} espace="hub" /> }}
      />
      <Tabs.Screen
        name="cours"
        options={{ title: 'Apprendre', tabBarActiveTintColor: actif(edu), tabBarIcon: ({ focused }) => <IconeOnglet nom="book" actif={focused} espace="edu" /> }}
      />
      <Tabs.Screen
        name="club"
        options={{ title: 'Club', tabBarActiveTintColor: actif(club), tabBarIcon: ({ focused }) => <IconeOnglet nom="users" actif={focused} espace="club" /> }}
      />
      <Tabs.Screen
        name="repetiteur"
        options={{ title: tuteur, tabBarActiveTintColor: actif(club), tabBarIcon: ({ focused }) => <IconeOnglet nom="sparkles" actif={focused} espace="ia" /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarActiveTintColor: actif(hub), tabBarIcon: ({ focused }) => <IconeOnglet nom="user" actif={focused} espace="hub" /> }}
      />
    </Tabs>
  );
}

/**
 * L'ICÔNE D'ONGLET. iOS : 25 px, le trait s'épaissit et prend la teinte de l'espace quand
 * l'onglet est ouvert. Android (Material 3) : pastille de 64 × 32 sur le fond doux de
 * l'espace, qui s'ouvre en largeur (`scaleX`, pilote natif) sous une icône de 24.
 */
function IconeOnglet({ nom, actif, espace }: { nom: IconName; actif: boolean; espace: Espace }) {
  const t = useToken();
  const teinte = useTeinteDe(espace);
  const b = useBascule(actif);
  const taille = isAndroid ? 24 : 25;
  const allume = isAndroid ? teinte.surDoux : teinte.rv;
  return (
    <View style={{ width: 64, height: 32, alignItems: 'center', justifyContent: 'center' }}>
      {isAndroid ? (
        <Animated.View
          style={{
            position: 'absolute', width: 64, height: 32, borderRadius: 16,
            backgroundColor: teinte.doux,
            opacity: b, transform: [{ scaleX: b.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}
        />
      ) : null}
      <Animated.View style={{ opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
        <Icon name={nom} size={taille} color={isAndroid ? t('textMuted') : t('ink3')} strokeWidth={isAndroid ? 2 : 1.9} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: b }}>
        <Icon name={nom} size={taille} color={allume} strokeWidth={isAndroid ? 2 : 2.3} />
      </Animated.View>
    </View>
  );
}
