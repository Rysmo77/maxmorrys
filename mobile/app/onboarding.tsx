import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, PanResponder, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { marquerAccueilVu } from '../donnees/accueil';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, Revele, Screen, Wordmark, haptique, useActionGradient,
  useBascule, useToken, type IconName, POLICE,
} from '../ds';

/**
 * ══ 2 · ONBOARDING ══
 *
 * Trois pas, passables, puis UN choix : créer son compte ou se connecter.
 *
 * ⚠️ IL PROMETTAIT DEUX CHOSES FAUSSES.
 *   · Le pas 3 annonçait « ÉCOUTE ÉCRAN VERROUILLÉ » : le binaire n'a aucun lecteur audio.
 *     C'est la promesse la plus coûteuse de l'application — une fonction annoncée au premier
 *     écran, absente du produit, est un motif de refus en revue autant qu'une déception.
 *   · Le pied disait « Aucun compte demandé. Tu peux tout parcourir avant de décider. »
 *     Toutes les vues du serveur exigent une session : sans compte, on ne parcourt rien.
 *
 * LES TROIS PAS SONT DONC TROIS GAINS RÉELS : la leçon gardée hors réseau, le répétiteur qui
 * sait où tu en es, la progression qui suit d'un appareil à l'autre.
 *
 * ── LE MOUVEMENT ──────────────────────────────────────────────────────────────────────
 * Chaque pas a SON glyphe, qui apparaît (`rv-s`, 380 ms) ; le titre remonte sous masque,
 * rejoué par la clé du pas. La pastille du pas courant s'étire en 220 ms. On passe d'un pas à
 * l'autre en balayant, ou par le bouton ; le retour Android recule d'un pas au lieu de
 * quitter l'application.
 */
const PAS: ReadonlyArray<{ eyebrow: string; titre: readonly string[]; chapo: string; glyphe: IconName }> = [
  {
    eyebrow: '1 sur 3',
    titre: ['APPRENDS', 'QUAND TU PEUX.', 'HORS RÉSEAU AUSSI.'],
    chapo: "Garde une leçon en Wi-Fi, lis-la dans le taxi. Ta progression part toute seule au retour du réseau — tu n'as rien à relancer.",
    glyphe: 'download',
  },
  {
    eyebrow: '2 sur 3',
    titre: ['UN RÉPÉTITEUR', 'QUI SAIT OÙ', 'TU EN ES.'],
    chapo: 'Il connaît ta leçon en cours et ce que tu lui as dit de toi. Tu peux le renommer, couper sa mémoire ou l’effacer quand tu veux.',
    glyphe: 'chat',
  },
  {
    eyebrow: '3 sur 3',
    titre: ['TON COMPTE', 'TE SUIT', 'PARTOUT.'],
    chapo: 'Le même compte que sur maxmorrys.me : tes formations, tes notes et ta progression sont déjà là, sur le site comme ici.',
    glyphe: 'smartphone',
  },
];

export default function Onboarding() {
  const t = useToken();
  const g = useActionGradient();
  const [pas, setPas] = useState(0);
  const courant = PAS[pas];
  const dernier = pas === PAS.length - 1;
  const pasRef = useRef(pas);
  pasRef.current = pas;

  function aller(n: number) {
    const cible = Math.max(0, Math.min(PAS.length - 1, n));
    if (cible === pasRef.current) return;
    haptique.selection();
    setPas(cible);
  }

  /* Le retour Android recule d'un pas ; au premier pas, il laisse faire le système. */
  useEffect(() => {
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pasRef.current === 0) return false;
      setPas(pasRef.current - 1);
      return true;
    });
    return () => abonnement.remove();
  }, []);

  const balayage = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 18 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onPanResponderRelease: (_e, gs) => {
      if (gs.dx < -40) aller(pasRef.current + 1);
      else if (gs.dx > 40) aller(pasRef.current - 1);
    },
  })).current;

  /* « Passer » compte autant que « Commencer » : l'accueil a été VU, dans les deux cas. */
  function finir(aller: () => void) {
    void marquerAccueilVu();
    aller();
  }

  return (
    <Screen
      territory="forme"
      espace="hub"
      droite={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer la présentation"
          onPress={() => finir(() => router.replace('/espace'))}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }}
        >
          <Text style={{ fontFamily: POLICE.corps, fontSize: 15, fontWeight: '600', color: t('textMuted') }}>
            Passer
          </Text>
        </Pressable>
      }
      contentStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1 }} {...balayage.panHandlers}>
        <Gradient
          colors={g.lecon}
          angle={140}
          radius={30}
          style={{ height: 220, marginTop: 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <Wordmark brand="rysmo" size={34} night tail={t('paperFixed')} /> {/* ok-ds — posé sur un aplat de marque, pas en mode sombre */}
          {/* Le glyphe du pas : il APPARAÎT, il ne glisse pas — c'est un objet, pas un texte. */}
          <Revele key={`g${pas}`} echelle style={{ position: 'absolute', right: 18, bottom: 18 }}>
            <View style={{
              width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              backgroundColor: t('paperFixed'),
            }}>
              <Icon name={courant.glyphe} size={21} color={t('mmBleu')} strokeWidth={2.2} />
            </View>
          </Revele>
        </Gradient>

        {/* La clé rejoue l'entrée du texte à chaque pas : le contenu CHANGE, il ne se
            remplace pas en silence. */}
        <View key={`t${pas}`}>
          <Eyebrow style={{ marginTop: 26 }}>{courant.eyebrow}</Eyebrow>
          <Display size={31} lines={courant.titre} style={{ marginTop: 8 }} />
          <Revele i={2}>
            <Body muted style={{ marginTop: 12, fontSize: 15, lineHeight: 22 }}>{courant.chapo}</Body>
          </Revele>
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />

        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Étape ${pas + 1} sur ${PAS.length}`}
          accessibilityValue={{ min: 1, max: PAS.length, now: pas + 1 }}
          style={{ flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 16 }}
        >
          {PAS.map((p, i) => <Pastille key={p.eyebrow} active={i === pas} onPress={() => aller(i)} />)}
        </View>

        {dernier ? (
          <>
            <Button tone="forme" label="Créer mon compte" onPress={() => finir(() => router.replace('/creation'))} />
            <Button tone="quiet" label="J'ai déjà un compte" style={{ marginTop: 9 }} onPress={() => finir(() => router.replace('/connexion'))} />
          </>
        ) : (
          <Button tone="forme" label="Continuer" onPress={() => aller(pas + 1)} />
        )}
      </View>
    </Screen>
  );
}

/**
 * La pastille du pas : elle S'ÉTIRE (7 → 22 px) en 220 ms au lieu de sauter. L'étirement est
 * un `scaleX` sur une barre déjà large, masquée par ses arrondis — le pilote natif ne sait pas
 * animer une largeur.
 */
function Pastille({ active, onPress }: { active: boolean; onPress: () => void }) {
  const t = useToken();
  const b = useBascule(active);
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityElementsHidden importantForAccessibility="no">
      <View style={{ width: 22, height: 7, alignItems: 'center' }}>
        <Animated.View style={{
          position: 'absolute', width: 22, height: 7, borderRadius: 4, backgroundColor: t('fill3'),
          opacity: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scaleX: b.interpolate({ inputRange: [0, 1], outputRange: [7 / 22, 1] }) }],
        }} />
        <Animated.View style={{
          position: 'absolute', width: 22, height: 7, borderRadius: 4, backgroundColor: t('ink'),
          opacity: b,
          transform: [{ scaleX: b.interpolate({ inputRange: [0, 1], outputRange: [7 / 22, 1] }) }],
        }} />
      </View>
    </Pressable>
  );
}
