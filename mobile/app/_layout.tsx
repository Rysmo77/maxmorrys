import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { edgeSwipeBack, screenAnimation, screenAnimationDuration, useScheme, useToken } from '../ds';
import { SessionProvider } from '../donnees/session';

/**
 * La racine. Elle ne fait que trois choses, et c'est délibéré.
 *
 * Aucune prop de thème n'est distribuée depuis ici : chaque composant appelle `useToken()`,
 * qui lit le mode lui-même. C'est la transposition native de la règle du web — le thème est
 * une portée, pas quelque chose qu'on passe de parent en enfant, sans quoi un écran oublié
 * retombe silencieusement sur ses valeurs claires.
 *
 * `SessionProvider` suit le même principe et pour la même raison : UNE souscription à
 * l'état d'authentification, ici, plutôt qu'une par écran. Deux souscriptions reçoivent leur
 * premier rappel à des instants différents, et deux écrans afficheraient deux vérités sur la
 * même question — qui regarde.
 */
export default function RootLayout() {
  const t = useToken();
  const scheme = useScheme();

  return (
    <SafeAreaProvider>
      {/* La barre système suit le fond réel, sinon elle tranche. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SessionProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: t('surfacePage') },
            /*
              LE MOUVEMENT N'EST PAS LE MÊME DES DEUX CÔTÉS, ET C'EST LE POINT.
              iOS pousse latéralement — l'idiome de `UINavigationController` — et le geste
              de retour au bord en dépend : la page doit venir de la droite pour qu'on
              comprenne qu'on la renvoie à droite. Material n'a pas ce geste et décrit un
              fondu sur l'axe Z, plus court : un fondu long se lit comme une latence.

              Le maillage, lui, NE BOUGE PAS sur aucune des deux — c'est le repère de
              continuité entre une liste et son détail.
            */
            animation: screenAnimation,
            animationDuration: screenAnimationDuration,
            /* Le geste de bord est attendu sur iOS, où il n'existe aucun bouton système.
               Sur Android il entre en concurrence avec le retour prédictif. */
            gestureEnabled: edgeSwipeBack,
          }}
        />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
