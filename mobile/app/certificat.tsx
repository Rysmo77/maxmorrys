import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  Body, Button, DocLine, Display, Eyebrow, Mesh, Num, Surface, Tag, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE CERTIFICAT — le second des DEUX moments scénarisés du produit, et le dernier.
 *
 * Le système n'en accorde que deux : l'attente de paiement, et celui-ci. « Il n'y en aura pas
 * un troisième » — ni à la réussite du paiement, ni à la série quotidienne, ni à la montée de
 * niveau. La fin de formation elle-même n'en a pas : elle MÈNE ici, et c'est cette carte qui
 * porte le moment. Deux mises en scène pour un même instant en annuleraient une.
 *
 * LA BRILLANCE, aux valeurs de `planche-moments.html` :
 *   blanc à 85 % · bande de 12 % de la largeur · inclinée à 102° · départ à 0,9 s ·
 *   2,4 s par passage · DEUX passages, puis l'arrêt définitif.
 *
 * « Un seul passage se rate : la personne regarde son nom, pas la carte. Trois passages
 * transforment la récompense en animation de chargement. Deux, puis l'arrêt définitif — et
 * l'écran redevient un document. »
 *
 * ELLE NE SE REJOUE PAS, et ça se tient à trois endroits :
 *   1. `DEJA_CELEBRES` retient le code dès le montage, AVANT même de savoir si l'animation
 *      va jouer. Revenir sur le certificat plus tard rend un document immobile.
 *   2. La séquence n'a pas de `loop` : deux `timing`, et `start()` rend la main pour de bon.
 *   3. `brille` retombe à faux à la fin, ce qui DÉMONTE la bande — il ne reste rien à rejouer.
 *
 * ⚠️ Cette mémoire vit dans le module, donc dans la session : relancer l'application rejouerait
 * la brillance une fois. La rendre définitive demande un stockage persistant, et aucun n'est
 * dans les dépendances de ce dossier. C'est à savoir avant de croire l'inverse.
 *
 * MOUVEMENT RÉDUIT : `AccessibilityInfo.isReduceMotionEnabled()` est interrogé avant de
 * lancer quoi que ce soit. Quelqu'un qui a demandé moins de mouvement reçoit le document, pas
 * la récompense — et le code retient quand même que le moment a eu lieu.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const DEPART_MS = 900;
const PASSAGE_MS = 2400;
/** L'angle du DÉGRADÉ au web. La bande, elle, est perpendiculaire : 102 − 90 = 12° d'inclinaison. */
const ANGLE_DEG = 102;
const LARGEUR_BANDE = 0.12;
const BLANC_A = 0.85;

/** Les certificats déjà fêtés dans cette session. Voir la note 1 ci-dessus. */
const DEJA_CELEBRES = new Set<string>();

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function lireDate(brut: string | undefined): Date | null {
  if (!brut) return null;
  const d = new Date(brut);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** « 12 septembre 2026 ». Écrit à la main : `Intl` n'est pas garanti sur tous les moteurs visés. */
function dateLongue(d: Date): string {
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Certificat() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const {
    code, titulaire, formation, emisLe, lecons, leconsTotal,
  } = useLocalSearchParams<{
    code?: string;
    titulaire?: string;
    formation?: string;
    emisLe?: string;
    lecons?: string;
    leconsTotal?: string;
  }>();

  const emis = lireDate(emisLe);
  /*
    LES QUATRE CHAMPS SONT SOLIDAIRES. Un certificat sans titulaire ne certifie personne ; sans
    date d'émission, ce n'est pas un document — et son code de vérification n'aurait aucune
    date à porter. On rend donc les quatre, ou aucun.
  */
  const complet = !!code && !!titulaire && !!formation && !!emis;

  const [taille, setTaille] = useState({ l: 0, h: 0 });
  const [brille, setBrille] = useState(false);
  const [ouverture, setOuverture] = useState(false);
  const balayage = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!complet || !code || taille.l === 0) return;
    if (DEJA_CELEBRES.has(code)) return;
    DEJA_CELEBRES.add(code);

    let annule = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduit) => {
      if (annule || reduit) return;
      setBrille(true);
      Animated.sequence([
        Animated.delay(DEPART_MS),
        Animated.timing(balayage, { toValue: 1, duration: PASSAGE_MS, useNativeDriver: true }),
        // Retour instantané hors cadre à gauche : aux deux bornes la bande est invisible,
        // donc le saut ne se voit pas — et il évite un troisième passage de retour.
        Animated.timing(balayage, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(balayage, { toValue: 1, duration: PASSAGE_MS, useNativeDriver: true }),
      ]).start(() => {
        if (!annule) setBrille(false);
      });
    });

    return () => { annule = true; };
  }, [complet, code, taille.l, balayage]);

  async function ouvrirVerification() {
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync('https://maxmorrys.me/verifier');
    } finally {
      setOuverture(false);
    }
  }

  async function partager() {
    if (!code) return;
    await Share.share({
      message: `Mon certificat Max-Morrys : https://maxmorrys.me/certificat/${code}\nCode de vérification : ${code}`,
    });
  }

  // La condition est réécrite en toutes lettres plutôt que reprise de `complet` : c'est elle
  // qui apprend au compilateur que les quatre champs existent dans tout ce qui suit.
  if (!code || !titulaire || !formation || !emis) {
    /*
      RIEN À MONTRER, ET ON LE DIT. Un écran de certificat qui se remplit de valeurs de
      démonstration produit un document faux — et un document faux se montre à un employeur.
    */
    return (
      <View style={{ flex: 1 }}>
        <Mesh territory="forme" />
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}>
          <Eyebrow>Certificat</Eyebrow>
          <Display size="sm" lines={['Aucun certificat', 'à afficher ici.']} style={{ marginTop: 6 }} />
          <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
            <Body style={{ fontWeight: '700' }}>Cet écran rend le certificat qu'on lui passe</Body>
            <Body muted style={{ marginTop: 8 }}>
              Le titulaire, la formation, la date d'émission et le code viennent du serveur qui
              a émis le document. Il en manque au moins un, alors rien n'est dessiné : une carte
              remplie de valeurs d'exemple serait un faux, et un faux se montre à un employeur.
            </Body>
            <Button
              tone="quiet"
              label={ouverture ? 'Ouverture…' : 'Ouvrir la page de vérification'}
              disabled={ouverture}
              onPress={() => void ouvrirVerification()}
              style={{ marginTop: 16 }}
            />
          </Surface>
        </ScrollView>
      </View>
    );
  }

  const bande = Math.max(14, taille.l * LARGEUR_BANDE);
  const translate = balayage.interpolate({
    inputRange: [0, 1],
    outputRange: [-1.3 * taille.l, 1.3 * taille.l],
  });

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/*
          LA DATE NE S'ÉCRIT PAS DANS LE SOURCIL. `Eyebrow` est un LIBELLÉ — « un nombre dedans
          passe par <Num> », dit sa propre note — et une date d'émission est précisément ce
          qu'on recoupe. Elle sort donc par `<Num>`, qui exige de dire d'où elle vient.
        */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Eyebrow>Émis le</Eyebrow>
          <Num value={dateLongue(emis)} source="server" asOf={emis} style={{ fontSize: 11 }} />
        </View>
        {/* Le prénom seul, écrit sur sa propre ligne : un titre d'affichage ne se replie
            jamais tout seul, et un nom complet en déborderait. */}
        <Display size="sm" lines={["C'est fait,", `${titulaire.trim().split(' ')[0]}.`]} style={{ marginTop: 6 }} />

        <Surface level="hero" style={{ marginTop: 20, padding: 24, overflow: 'hidden' }}>
          {/* La mesure sert au balayage : sans largeur, la bande n'a pas de course à faire. */}
          <View
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setTaille((p) => (p.l === width && p.h === height ? p : { l: width, h: height }));
            }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            pointerEvents="none"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <Eyebrow>Certificat de fin de formation</Eyebrow>
            {/*
              « VÉRIFIABLE », ET PAS « VÉRIFIÉ ». L'application ne vérifie rien : elle affiche
              ce qu'on lui a passé, et un lien profond peut lui passer n'importe quoi. Ce qui
              rend ce document opposable, c'est le code — contrôlable par quelqu'un d'autre,
              ailleurs. Écrire « Vérifié » ferait porter à l'écran une garantie qu'il n'a pas.
            */}
            <Tag tone="ok">Vérifiable</Tag>
          </View>

          <Display size="xs" style={{ marginTop: 14 }}>{formation}</Display>

          <Body muted style={{ marginTop: 11 }}>
            Délivré à <Body style={{ fontWeight: '700' }}>{titulaire}</Body>
          </Body>

          <View style={{ height: 1, backgroundColor: t('line'), marginVertical: 19 }} />

          <Eyebrow>Code de vérification</Eyebrow>
          <Num
            value={code}
            source="server"
            asOf={emis}
            style={{ fontSize: 19, letterSpacing: 1.1, marginTop: 4 }}
          />
          <Body muted style={{ marginTop: 9, fontSize: 11.5 }}>
            Vérifiable par n'importe qui, sans compte, sans que ton nom apparaisse dans une
            liste. La page de contrôle répond à un code, et à un seul : elle ne permet pas de
            lister les certificats émis, ni de remonter à ton compte.
          </Body>

          {brille && taille.l > 0 && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                // La bande dépasse largement en haut et en bas : inclinée de 12°, une bande
                // à la hauteur exacte de la carte laisserait deux coins non balayés.
                top: -taille.h * 0.4,
                height: taille.h * 1.8,
                width: bande,
                transform: [{ translateX: translate }, { rotate: `${ANGLE_DEG - 90}deg` }],
              }}
            >
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="brillance" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={t('paperFixed')} stopOpacity={0} />
                    <Stop offset="0.5" stopColor={t('paperFixed')} stopOpacity={BLANC_A} />
                    <Stop offset="1" stopColor={t('paperFixed')} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#brillance)" />
              </Svg>
            </Animated.View>
          )}
        </Surface>

        <Button tone="forme" label="Partager le lien de vérification" onPress={() => void partager()} style={{ marginTop: 17 }} />
        <Button
          tone="quiet"
          label={ouverture ? 'Ouverture…' : 'Ouvrir la page de vérification'}
          disabled={ouverture}
          onPress={() => void ouvrirVerification()}
          style={{ marginTop: 10 }}
        />

        <Surface level="truth" style={{ marginTop: 18, padding: 18 }}>
          <Eyebrow>Pourquoi il vaut quelque chose</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Les leçons ont été recomptées côté serveur au moment de l'émission. Ce n'est pas une
            image : c'est un enregistrement que ton futur employeur contrôle lui-même.
          </Body>
          <View style={{ marginTop: 12 }}>
            <DocLine
              label="Leçons validées"
              value={
                <Num
                  value={lecons && leconsTotal ? `${lecons} / ${leconsTotal}` : (lecons ?? null)}
                  source="server"
                  asOf={emis}
                  fallback="non transmis"
                  style={{ fontSize: 13.5 }}
                />
              }
            />
            <DocLine
              label="Émis le"
              value={<Num value={dateLongue(emis)} source="server" asOf={emis} style={{ fontSize: 13.5 }} />}
              last
            />
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}
