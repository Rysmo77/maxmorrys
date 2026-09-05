import { View } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Body, Mesh, Wordmark, useToken } from '../ds';
import { useSession } from '../donnees/session';

/**
 * ══ 1 · LANCEMENT ══
 *
 * AUCUN INDICATEUR DE PROGRESSION, et c'est la seule décision de cet écran.
 *
 * Une barre de chargement branchée sur rien est un mensonge de trois secondes : elle avance
 * à vitesse constante quoi qu'il arrive, donc elle ne dit rien de l'état réel et elle promet
 * une fin qu'elle ne connaît pas. Le maillage, le mot-symbole, et c'est tout.
 *
 * ⚠️ L'ATTENTE EST DEVENUE RÉELLE, et l'argument tient toujours. On n'attend plus 900 ms
 * pour rien : on attend que le SDK ait relu la session depuis le stockage de l'appareil.
 * Cette durée-là est inconnue — quelques dizaines de millisecondes d'habitude, davantage sur
 * un téléphone lent au premier lancement — et c'est précisément pourquoi une barre reste
 * exclue. Une durée qu'on ne connaît pas ne se dessine pas.
 *
 * ── POURQUOI CE N'EST PAS `if (anonyme) → /connexion` TOUT DE SUITE ──────────────────
 * Parce qu'avant le premier rappel de `onAuthStateChanged`, on ne sait PAS s'il y a
 * quelqu'un. Router sur `anonyme` sans attendre `restauration` renverrait vers la connexion
 * une personne déjà connectée, le temps d'un battement, avant de se raviser. C'est le
 * clignotement le plus courant des applications qui branchent Firebase, et il vient
 * toujours de là.
 *
 * ⚠️ CE N'EST PAS L'ÉCRAN DE LANCEMENT DU SYSTÈME. Celui-là est une IMAGE posée par l'OS
 * avant que le moteur JavaScript ne démarre — il se déclare dans `app.json` et demande
 * `expo-splash-screen`, installé depuis le chantier des fontes. Cet écran-ci est le premier
 * rendu de l'application : il prend le relais de l'image système, sans couture visible parce
 * qu'il porte le même fond.
 */
export default function Lancement() {
  const t = useToken();
  const session = useSession();

  useEffect(() => {
    // Tant qu'on ne sait pas, on ne bouge pas. C'est tout le sujet de cet écran.
    if (session.phase === 'restauration') return;

    /* Le délai ne sert plus à faire patienter : il laisse le premier rendu se peindre avant
       la transition. Sans lui, la bascule se joue sur un écran encore blanc, et on voit un
       clignotement au lieu d'un enchaînement. Il est court, et il ne s'ajoute pas à
       l'attente réelle — la restauration a déjà eu lieu quand on arrive ici. */
    const minuteur = setTimeout(() => {
      if (session.phase === 'connectee') router.replace('/(tabs)');
      /* `nonConfigure` va aussi vers l'accueil : les écrans y disent eux-mêmes ce qui manque,
         et rediriger vers une connexion qui ne peut pas aboutir serait une impasse muette. */
      else router.replace('/onboarding');
    }, 220);
    return () => clearTimeout(minuteur);
  }, [session]);

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
