import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  edgeSwipeBack, screenAnimation, screenAnimationDuration, useFontesChargees, useScheme, useToken,
} from '../ds';
import { SessionProvider } from '../donnees/session';

/*
 * L'ÉCRAN DE LANCEMENT RESTE EN PLACE TANT QUE LES FONTES NE SONT PAS TRANCHÉES.
 *
 * Appelé au chargement du module, donc avant le premier rendu : c'est la seule fenêtre où
 * `preventAutoHideAsync()` a encore un effet. Sans lui, l'application rendrait son premier
 * écran en police système puis SAUTERAIT à la marque une fraction de seconde plus tard —
 * ce saut se lit comme un défaut, là où une attente d'un instant ne se lit pas du tout.
 *
 * L'échec est avalé volontairement : ne pas pouvoir retenir l'écran de lancement est un
 * inconfort, mais une promesse rejetée au chargement du module ferait tomber l'application.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * La racine. Elle ne fait que quatre choses, et c'est délibéré.
 *
 * La quatrième est la plus récente : elle ATTEND LES FONTES. C'est le seul endroit d'où
 * l'attente peut précéder tout rendu, et c'est pour ça qu'elle est ici et non dans `ds/` —
 * la table, elle, appartient au système (`ds/Fontes.ts`).
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
  /*
   * Les trois familles de marque. Le hook rend `true` quand elles sont prêtes — OU quand leur
   * chargement a échoué, auquel cas il l'a déjà journalisé. Un démarrage bloqué serait pire
   * qu'une police de repli : voir `ds/Fontes.ts`.
   */
  const fontesPretes = useFontesChargees();

  useEffect(() => {
    if (!fontesPretes) return;
    // L'effet passe APRÈS le commit du premier rendu de marque : l'écran de lancement se
    // retire donc sur quelque chose de déjà dessiné, pas sur un fond vide.
    SplashScreen.hideAsync().catch(() => {});
  }, [fontesPretes]);

  /* Rien du tout tant que la question n'est pas tranchée — l'écran de lancement couvre. */
  if (!fontesPretes) return null;

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
