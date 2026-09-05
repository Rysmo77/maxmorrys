import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Body, Button, Display, Gradient, Icon, Screen, Surface,
  edgeSwipeBack, screenAnimation, screenAnimationDuration, useFontesChargees, useScheme, useToken,
} from '../ds';
import { SessionProvider } from '../donnees/session';
import { deconnexion } from '../donnees/identite';
import { retirerVerrou, useVerrouDeDemarrage, type Porte } from '../donnees/verrou';

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
 * La racine. Elle ne fait que cinq choses, et c'est délibéré.
 *
 * La quatrième ATTEND LES FONTES. C'est le seul endroit d'où l'attente peut précéder tout
 * rendu, et c'est pour ça qu'elle est ici et non dans `ds/` — la table, elle, appartient au
 * système (`ds/Fontes.ts`).
 *
 * La cinquième est la plus récente : elle ATTEND LE VERROU, pour exactement la même raison.
 * Un verrou biométrique qui s'affiche APRÈS le contenu n'a rien protégé — on aurait vu la
 * liste des cours, les messages du Club et le nom du compte avant que l'invite ne s'ouvre.
 * `<Porte>` est donc posée ENTRE la session et le `<Stack>` : au-dessus d'elle il n'y a pas
 * de `useSession()`, en dessous il n'y a que du contenu.
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

  /* Rien du tout tant que la question n'est pas tranchée — l'écran de lancement couvre. */
  if (!fontesPretes) return null;

  return (
    <SafeAreaProvider>
      {/* La barre système suit le fond réel, sinon elle tranche. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SessionProvider>
        <Porte>
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
        </Porte>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

/**
 * LA PORTE. Elle rend le contenu, l'écran verrouillé, ou rien — jamais deux à la fois.
 *
 * ⚠️ C'EST ELLE QUI RETIRE L'ÉCRAN DE LANCEMENT, et plus la racine. Le retirer à l'arrivée
 * des fontes rendrait un fond vide pendant que le coffre et la session répondent : l'attente
 * du verrou est courte, mais elle n'est pas nulle, et un écran blanc d'un demi-seconde au
 * lancement se lit comme un plantage. L'écran de lancement couvre donc jusqu'à ce que la
 * porte ait tranché — dans les deux sens.
 */
function Porte({ children }: { children: ReactNode }) {
  const { porte, extinction } = useVerrouDeDemarrage();
  const dit = useRef(false);

  useEffect(() => {
    if (porte.etat === 'attente') return;
    // L'effet passe APRÈS le commit du premier rendu de marque : l'écran de lancement se
    // retire donc sur quelque chose de déjà dessiné, pas sur un fond vide.
    SplashScreen.hideAsync().catch(() => {});
  }, [porte.etat]);

  useEffect(() => {
    if (extinction === null || dit.current) return;
    dit.current = true;
    /* Le réglage vient de s'éteindre tout seul. Le taire laisserait quelqu'un croire que son
       téléphone est encore verrouillé alors qu'il ne l'est plus — la forme d'erreur la plus
       coûteuse, parce qu'elle rassure. */
    Alert.alert("Le déverrouillage s'est éteint", extinction);
  }, [extinction]);

  if (porte.etat === 'attente') return null;
  if (porte.etat === 'verrouille') return <EcranVerrouille porte={porte} />;
  return <>{children}</>;
}

/**
 * L'ÉCRAN VERROUILLÉ — et sa sortie, qui n'est pas décorative.
 *
 * Un capteur sale, un visage mal reconnu, une invite refusée par erreur : sans porte de
 * sortie, le compte deviendrait inaccessible DEPUIS CE TÉLÉPHONE, et la seule issue serait
 * de désinstaller l'application. « Me déconnecter » est donc une exigence, pas un confort.
 *
 * Et elle RETIRE le drapeau au passage. Sans ça, quelqu'un dont le capteur ne répond plus se
 * déconnecterait, se reconnecterait, et retomberait sur le même mur au prochain démarrage à
 * froid — une boucle dont il ne pourrait pas sortir puisqu'il n'atteindrait jamais le profil.
 */
function EcranVerrouille({ porte }: { porte: Extract<Porte, { etat: 'verrouille' }> }) {
  const t = useToken();
  const [sortie, setSortie] = useState(false);

  async function quitter() {
    if (sortie) return;
    setSortie(true);
    await retirerVerrou();
    await deconnexion();
  }

  return (
    <Screen territory="transforme" center>
      <Gradient
        colors={[t('mmTealN'), t('mmBleu')]}
        radius={21}
        style={{
          width: 66, height: 66, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="lock" size={27} color={t('paperFixed')} strokeWidth={2.2} />
      </Gradient>

      <Display size={29} lines={['RYSMO EST', 'VERROUILLÉ.']} style={{ marginTop: 22 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        {porte.motif}
      </Body>

      <Button
        tone="digitalise"
        label={`Réessayer avec ${porte.geste}`}
        style={{ marginTop: 18 }}
        disabled={porte.enCours || sortie}
        onPress={porte.reessayer}
      />
      <Button
        tone="quiet"
        label="Me déconnecter"
        style={{ marginTop: 9 }}
        disabled={sortie}
        onPress={() => { void quitter(); }}
      />

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Body muted style={{ fontSize: 12.5, lineHeight: 19 }}>
          Te déconnecter éteint aussi ce verrou : un capteur qui ne répond plus ne doit pas
          te fermer ton propre compte. Ton mot de passe, lui, n'a jamais cessé de marcher.
        </Body>
      </Surface>
    </Screen>
  );
}
