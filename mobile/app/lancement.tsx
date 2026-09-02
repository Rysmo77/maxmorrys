import { View } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Body, Mesh, Wordmark, useToken } from '../ds';

/**
 * ══ 1 · LANCEMENT ══
 *
 * AUCUN INDICATEUR DE PROGRESSION, et c'est la seule décision de cet écran.
 *
 * Une barre de chargement branchée sur rien est un mensonge de trois secondes : elle avance
 * à vitesse constante quoi qu'il arrive, donc elle ne dit rien de l'état réel et elle promet
 * une fin qu'elle ne connaît pas. Le maillage, le mot-symbole, et c'est tout.
 *
 * ⚠️ CE N'EST PAS L'ÉCRAN DE LANCEMENT DU SYSTÈME. Celui-là est une IMAGE posée par l'OS
 * avant que le moteur JavaScript ne démarre — il se déclare dans `app.json` et demande
 * `expo-splash-screen`, qui n'est pas installé (voir README). Cet écran-ci est le premier
 * rendu de l'application : il prend le relais de l'image système, sans couture visible parce
 * qu'il porte le même fond.
 */
export default function Lancement() {
  const t = useToken();

  useEffect(() => {
    /* On n'attend RIEN d'artificiel. Le délai n'existe que pour laisser le premier rendu se
       peindre avant la transition — sans lui, la bascule se joue sur un écran encore blanc,
       et on voit un clignotement au lieu d'un enchaînement. */
    const minuteur = setTimeout(() => router.replace('/onboarding'), 900);
    return () => clearTimeout(minuteur);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t('surfacePage') }}>
      <Mesh territory="transforme" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Wordmark brand="rysmo" size={44} />
        <Body
          muted
          style={{
            fontFamily: 'JetBrainsMono', fontSize: 10.5, letterSpacing: 1.7,
            textTransform: 'uppercase', color: t('textFaint'),
          }}
        >
          par Max-Morrys · Dakar
        </Body>
      </View>
    </View>
  );
}
