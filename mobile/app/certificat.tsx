import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  Body, Button, Display, DocLine, Eyebrow, Icon, IconButton, Num, SansDonnees, Screen, Surface, Tag, Wordmark, useToken,
} from '../ds';
import { CERTIFICAT, RELEVE, SITE, SOURCE } from '../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 6 · LE CERTIFICAT ══ — LE SECOND DES DEUX MOMENTS SCÉNARISÉS DU SYSTÈME.
 *
 * Une brillance passe DEUX FOIS, puis plus jamais. Le nombre compte : une brillance en boucle
 * devient un motif de fond, et un motif de fond ne fête rien. Deux passages disent « ceci
 * vient d'arriver », et l'écran redevient un document.
 *
 * ── « VÉRIFIABLE », ET PAS « VÉRIFIÉ » ────────────────────────────────────────────────────
 * L'application ne vérifie rien : elle affiche ce qu'on lui passe, et un lien profond peut lui
 * passer n'importe quoi. Ce qui rend ce document opposable, c'est le CODE — contrôlable par
 * quelqu'un d'autre, ailleurs, sans compte. Le transfert écrit « Vérifié » ; l'écran garde
 * « Vérifiable », qui est ce que l'application peut réellement affirmer.
 *
 * ── LE PARTAGE PASSE PAR LA FEUILLE SYSTÈME ──────────────────────────────────────────────
 * D'où UN bouton au lieu de deux : la feuille apporte ses propres cibles, y compris « copier ».
 * Et ce qui part est le LIEN, jamais une image — une capture ne se vérifie pas.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const DEPART_MS = 900;
const PASSAGE_MS = 2400;
/** L'angle du DÉGRADÉ au web. La bande, elle, est perpendiculaire : 102 − 90 = 12° d'inclinaison. */
const ANGLE_DEG = 102;
const LARGEUR_BANDE = 0.12;
const BLANC_A = 0.85;

/** Les certificats déjà fêtés dans cette session : la brillance ne se rejoue pas au retour. */
const DEJA_CELEBRES = new Set<string>();

export default function Certificat() {
  const t = useToken();
  const { code, titulaire, formation, emisLe, lecons } = useLocalSearchParams<{
    code?: string; titulaire?: string; formation?: string; emisLe?: string; lecons?: string;
  }>();

  /*
   * LES QUATRE CHAMPS SONT SOLIDAIRES. Un certificat sans titulaire ne certifie personne ;
   * sans date d'émission, ce n'est pas un document. On les rend tous, ou aucun — et on ne
   * complète JAMAIS un jeu partiel avec l'autre source : moitié serveur, moitié démonstration
   * produirait un document au nom de quelqu'un avec le code d'un autre.
   */
  const doc = (code && titulaire && formation && emisLe && lecons)
    ? { code, titulaire, formation, emisLe, lecons }
    : CERTIFICAT
      ? {
        code: CERTIFICAT.code,
        titulaire: CERTIFICAT.titulaire,
        formation: CERTIFICAT.formation,
        emisLe: CERTIFICAT.emisLe,
        lecons: String(CERTIFICAT.lecons),
      }
      : null;
  const lien = doc === null ? null : `${SITE}/verifier/${doc.code}`;
  const prenom = doc === null ? null : doc.titulaire.trim().split(' ')[0];

  const [taille, setTaille] = useState({ l: 0, h: 0 });
  const [brille, setBrille] = useState(false);
  const balayage = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (doc === null || taille.l === 0 || DEJA_CELEBRES.has(doc.code)) return;
    DEJA_CELEBRES.add(doc.code);

    let annule = false;
    /*
      MOUVEMENT RÉDUIT : ON NE LANCE RIEN. Le système ramène ses durées à 1 ms sous
      `prefers-reduced-motion` — la traduction CSS de « n'anime pas ». Reproduire le chiffre
      ferait tourner un pilote à plein régime pour un résultat immobile.
    */
    void AccessibilityInfo.isReduceMotionEnabled().then((reduit) => {
      if (annule || reduit) return;
      setBrille(true);
      Animated.sequence([
        Animated.delay(DEPART_MS),
        Animated.timing(balayage, { toValue: 1, duration: PASSAGE_MS, useNativeDriver: true }),
        // Retour instantané hors cadre : aux deux bornes la bande est invisible, donc le saut
        // ne se voit pas — et il évite un troisième passage de retour.
        Animated.timing(balayage, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(balayage, { toValue: 1, duration: PASSAGE_MS, useNativeDriver: true }),
      ]).start(() => { if (!annule) setBrille(false); });
    });

    return () => { annule = true; };
  }, [doc, taille.l, balayage]);

  async function partager() {
    if (doc === null || lien === null) return;
    await Share.share({
      message: `Mon certificat — ${doc.formation}\n${lien}`,
      url: lien,
    });
  }

  const bande = Math.max(14, taille.l * LARGEUR_BANDE);
  const translate = balayage.interpolate({
    inputRange: [0, 1],
    outputRange: [-1.3 * taille.l, 1.3 * taille.l],
  });

  /* La garde vient APRÈS les hooks : un retour anticipé placé avant eux changerait leur
     ordre d'un rendu à l'autre, ce que React refuse. */
  if (doc === null || lien === null || prenom === null) {
    return (
      <Screen territory="forme" retour="Espace">
        <Display size={27} lines={['Aucun certificat', 'à afficher.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="ce certificat"
          origine="du serveur qui l'a émis"
          degat="Un certificat rempli de valeurs d'exemple est un faux, et un faux se montre à un employeur. Les quatre champs — titulaire, formation, date, code — arrivent ensemble ou pas du tout."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      territory="forme"
      retour="Espace"
      /* ⚠️ LES PARAMÈTRES MANQUAIENT. `/partage` compose le lien de vérification à partir du
         certificat ; sans eux il retombait sur la démonstration, donc sur RIEN en production
         — l'écran de partage d'un certificat qu'on venait d'ouvrir affichait « Rien à
         partager ». */
      droite={
        <IconButton
          label="Partager mon certificat"
          onPress={() => router.push({
            pathname: '/partage',
            params: { code: doc.code, titulaire: doc.titulaire, formation: doc.formation, emisLe: doc.emisLe },
          })}
        >
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <Eyebrow>Formation terminée ·</Eyebrow>
        <Num value={doc.emisLe} source={SOURCE} asOf={RELEVE} style={{ fontSize: 11 }} />
      </View>
      {/* Le PRÉNOM seul sur sa ligne : un titre d'affichage ne se replie jamais tout seul, et
          un nom complet déborderait d'un écran de 360 px sans que rien ne le signale. */}
      <Display size={31} lines={["C'EST FAIT,", `${prenom.toUpperCase()}.`]} style={{ marginTop: 8 }} />

      <Surface level="hero" style={{ marginTop: 20, padding: 20, overflow: 'hidden' }}>
        {/* La mesure sert au balayage : sans largeur, la bande n'a pas de course à faire. */}
        <View
          pointerEvents="none"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setTaille((p) => (p.l === width && p.h === height ? p : { l: width, h: height }));
          }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <Wordmark brand="signature" size={27} short />
          <Tag tone="ok">Vérifiable</Tag>
        </View>

        <Eyebrow style={{ marginTop: 18 }}>Certificat de fin de formation</Eyebrow>
        <Display size={20} style={{ marginTop: 6 }}>{doc.formation}</Display>
        <Body muted style={{ marginTop: 10, fontSize: 13 }}>
          Délivré à <Body style={{ fontWeight: '700', fontSize: 13 }}>{doc.titulaire}</Body>
        </Body>
        <Num value={doc.code} source={SOURCE} asOf={RELEVE} style={{ fontSize: 16, letterSpacing: 1.1, marginTop: 14 }} />

        {brille && taille.l > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute', left: 0,
              // La bande dépasse largement en haut et en bas : inclinée de 12°, une bande à la
              // hauteur exacte de la carte laisserait deux coins non balayés.
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
        ) : null}
      </Surface>

      <Button
        tone="forme"
        label="Partager mon certificat"
        icon="share"
        style={{ marginTop: 18 }}
        onPress={() => void partager()}
      />
      <Body muted style={{ fontSize: 11.5, textAlign: 'center', marginTop: 10, color: t('textFaint') }}>
        Ce qui part est le lien de vérification, pas une image.
      </Body>

      <Surface level="truth" style={{ marginTop: 18, padding: 15 }}>
        <Eyebrow>Ce que ce code prouve</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Les {doc.lecons} leçons ont été recomptées côté serveur au moment de l'émission. Ce
          n'est pas une image : c'est un enregistrement que ton futur employeur contrôle
          lui-même, sans compte.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 17 }}>
        <DocLine
          label="Titulaire"
          value={<Body style={{ fontWeight: '700', fontSize: 13.5 }}>{doc.titulaire}</Body>}
        />
        <DocLine
          label="Émis le"
          value={<Num value={doc.emisLe} source={SOURCE} asOf={RELEVE} style={{ fontSize: 13.5 }} />}
        />
        <DocLine
          label="Leçons validées"
          value={<Num value={`${doc.lecons} / ${doc.lecons}`} source={SOURCE} asOf={RELEVE} style={{ fontSize: 13.5 }} />}
          last
        />
      </Surface>

      <Button
        tone="quiet"
        label="Voir la page publique"
        trailing="external"
        style={{ marginTop: 14 }}
        onPress={() => { void openBrowserAsync(lien); }}
      />
    </Screen>
  );
}
