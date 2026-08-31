import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useScheme, useToken } from '../ds';

/**
 * La racine. Elle ne fait que trois choses, et c'est délibéré.
 *
 * Aucune prop de thème n'est distribuée depuis ici : chaque composant appelle `useToken()`,
 * qui lit le mode lui-même. C'est la transposition native de la règle du web — le thème est
 * une portée, pas quelque chose qu'on passe de parent en enfant, sans quoi un écran oublié
 * retombe silencieusement sur ses valeurs claires.
 */
export default function RootLayout() {
  const t = useToken();
  const scheme = useScheme();

  return (
    <SafeAreaProvider>
      {/* La barre système suit le fond réel, sinon elle tranche. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t('surfacePage') },
          // Entrer dans un détail : 260 ms. Le maillage, lui, NE BOUGE PAS — c'est le repère
          // de continuité entre une liste et son détail.
          animation: 'slide_from_right',
          animationDuration: 260,
        }}
      />
    </SafeAreaProvider>
  );
}
