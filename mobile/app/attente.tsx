import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Easing, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Body, Button, Display, Icon, Mesh, Num, Surface, Tag, useToken } from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'ATTENTE DE PAIEMENT — l'un des DEUX seuls moments scénarisés du produit.
 *
 * Le système n'accorde une vraie mise en scène qu'à deux endroits (`planche-moments.html`),
 * et celui-ci en est un. Ce n'est pas un ornement : c'est la seule chose qui dit « la
 * transaction est vivante » à quelqu'un qui a quitté l'application pour valider dans Wave et
 * revient trente secondes plus tard sans savoir si ça a marché. **C'est le point du parcours
 * où se perd le plus de monde.**
 *
 * LES VALEURS SONT CELLES DE `brand/motion.css`, PAS DES APPROXIMATIONS :
 *
 *     @keyframes ring { 0%   { transform: scale(1);    opacity: .5 }
 *                       80%,
 *                       100% { transform: scale(1.85); opacity: 0  } }
 *     .pulse::before { animation: ring 2.6s      infinite var(--ease-out) }
 *     .pulse::after  { animation: ring 2.6s 1.3s infinite var(--ease-out) }
 *
 * Deux anneaux concentriques, `scale` 1 → 1,85, opacité .5 → 0, sur 2,6 s, le second décalé
 * de 1,3 s, en boucle. Le PIC EST À 80 % du cycle, puis l'anneau se maintient éteint pendant
 * le dernier cinquième : c'est ce palier qui espace les vagues au lieu d'en faire un
 * clignotement. Il est reproduit par une interpolation à trois points, pas par une durée
 * raccourcie.
 *
 * `scale` et `opacity` sont exactement les deux propriétés que la règle 3 autorise, et
 * exactement les deux que le pilote natif accepte — d'où `useNativeDriver: true`, qui sort
 * l'animation du fil JavaScript et la laisse tourner même si ce fil est occupé.
 *
 * CE QU'IL NE FAUT PAS EN FAIRE, et ce que cet écran ne fait donc pas :
 *   • PAS DE COMPTE À REBOURS. La durée dépend de l'opérateur, pas de nous, et un compteur
 *     qui se termine sans réponse est pire que pas de compteur.
 *   • PAS DE BARRE DE PROGRESSION. Il n'y a rien à mesurer.
 *   • PAS DE « cette page se met à jour toute seule » : rien ne l'interroge dans ce port.
 *     Promettre une mise à jour automatique sur l'écran où quelqu'un attend son argent est le
 *     genre de phrase qui fait attendre pour rien.
 *   • PAS DE RACCOURCI VERS `/succes` OU `/echec`. Une issue de paiement se décide côté
 *     serveur ; un bouton qui la simule ici afficherait « payé » sans que rien ne soit payé.
 *
 * PARAMÈTRES DE ROUTE :
 *   ?moyen=Wave                    le moyen choisi à l'écran précédent
 *   &montant=80750                 le montant AFFICHÉ ; le débité est recalculé serveur
 *   &reference=MM-2K6-4831         la référence de la commande
 *   &suivi=https://maxmorrys.me/…  l'URL de suivi, ouverte dans le navigateur système (AD-11)
 *   &asOf=2026-09-01T10:00:00Z     la date des relevés (règle 6)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** `brand/motion.css` — 2,6 s de cycle, second anneau décalé de 1,3 s, pic à 80 %. */
const DUREE = 2600;
const DECALAGE = 1300;
const SOMMET = 0.8;
/** `--ease-out` du système : `cubic-bezier(.16,1,.3,1)`. */
const SORTIE = Easing.bezier(0.16, 1, 0.3, 1);
/** Le carré du prestataire : 70 × 70, rayon 22 — les valeurs de la planche. */
const CARRE = 70;
const RAYON = 22;

/**
 * Le seul hôte vers lequel cet écran accepte de partir. Une route d'expo-router s'ouvre par
 * lien profond (`rysmo://attente?suivi=…`) : sans cette borne, n'importe qui pourrait faire
 * ouvrir n'importe quelle page depuis un écran qui porte le mot « paiement ».
 */
const PAY_ORIGIN = 'https://maxmorrys.me';

export default function Attente() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { moyen, montant, reference, suivi, asOf } = useLocalSearchParams<{
    moyen?: string; montant?: string; reference?: string; suivi?: string; asOf?: string;
  }>();

  const propose = asOf ? new Date(asOf) : null;
  const releve = propose && !Number.isNaN(propose.getTime()) ? propose : new Date();

  const somme = montant ? Number(montant) : Number.NaN;
  const aPayer = Number.isFinite(somme) ? somme : null;
  const suiviSur = suivi && suivi.startsWith(`${PAY_ORIGIN}/`) ? suivi : null;

  /*
    LA TEINTE DU PRESTATAIRE VIENT D'UN JETON, PAS DE SA CHARTE. Le bleu de Wave (#009FE3) et
    l'orange d'Orange Money ne font pas partie des 213 jetons du système : les écrire ici en
    hexadécimal serait un défaut de mode sombre garanti — ils ne seraient jamais redéclarés en
    nuit, alors que les quatre teintes de marque, elles, le sont. Le bleu et l'orange du
    système tiennent le rôle, et ils suivent le mode.
  */
  const label = moyen ?? '';
  const teinte = /orange/i.test(label) ? t('mmOrange') : /carte/i.test(label) ? t('ink') : t('mmBleu');
  const initiales = label.trim().split(/\s+/).map((mot) => mot.charAt(0)).join('').slice(0, 2).toUpperCase();

  /*
    `null` tant que la préférence n'est pas lue : on ne lance rien avant de savoir. Démarrer
    puis couper donnerait une secousse à la personne même qui a demandé moins de mouvement.
  */
  const [reduit, setReduit] = useState<boolean | null>(null);
  const anneauA = useRef(new Animated.Value(0)).current;
  const anneauB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let monte = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (monte) setReduit(v); });
    // La préférence se change pendant que l'application tourne : on la suit, sinon l'anneau
    // continue de battre derrière un réglage qui vient de dire non.
    const abonnement = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduit(v));
    return () => { monte = false; abonnement.remove(); };
  }, []);

  useEffect(() => {
    /*
      MOUVEMENT RÉDUIT : ON NE DÉMARRE RIEN. Le système ramène toutes ses durées à 1 ms sous
      `prefers-reduced-motion` — c'est la traduction CSS de « n'anime pas ». Reproduire le
      chiffre à la lettre ici ferait tourner une boucle infinie à 1 ms, soit un pilote
      d'animation à plein régime pour un résultat immobile, sur un appareil à 4 cœurs. Le
      pendant natif de « durée 1 ms », c'est l'absence de boucle : les anneaux restent à leur
      valeur de repos (scale 1, opacité .5), le carré ne bouge plus, et rien ne clignote.
    */
    if (reduit !== false) return;

    const cycle = (valeur: Animated.Value) => Animated.loop(
      Animated.timing(valeur, { toValue: 1, duration: DUREE, easing: SORTIE, useNativeDriver: true }),
    );

    // Le second anneau part 1,3 s après le premier, PUIS boucle sur les mêmes 2,6 s. Un
    // `delay` glissé DANS la boucle allongerait sa période à 3,9 s et les deux vagues
    // dériveraient l'une par rapport à l'autre au bout de quelques tours.
    const a = cycle(anneauA);
    const b = Animated.sequence([Animated.delay(DECALAGE), cycle(anneauB)]);
    a.start();
    b.start();

    return () => {
      a.stop();
      b.stop();
      anneauA.setValue(0);
      anneauB.setValue(0);
    };
  }, [reduit, anneauA, anneauB]);

  // Trois points d'interpolation, pas deux : le palier de 80 % à 100 % est ce qui sépare les
  // vagues. Au repos (valeur 0) l'anneau vaut scale 1 et opacité .5 — un liseré immobile.
  const echelle = (valeur: Animated.Value) =>
    valeur.interpolate({ inputRange: [0, SOMMET, 1], outputRange: [1, 1.85, 1.85] });
  const voile = (valeur: Animated.Value) =>
    valeur.interpolate({ inputRange: [0, SOMMET, 1], outputRange: [0.5, 0, 0] });

  const anneau = {
    position: 'absolute' as const,
    top: 0, right: 0, bottom: 0, left: 0,
    borderRadius: RAYON,
    borderWidth: 2,
    borderColor: teinte,
  };

  async function ouvrirLeSuivi() {
    if (!suiviSur) return;
    try {
      // Comme `paiement.tsx` : la session partage les cookies du site, donc quelqu'un déjà
      // connecté ne se reconnecte pas pour lire l'état de sa propre commande.
      await WebBrowser.openAuthSessionAsync(suiviSur, 'rysmo://paiement/retour');
    } catch {
      // Le motif, la conséquence, la sortie — dans cet ordre.
      Alert.alert(
        "Le navigateur n'a pas pu s'ouvrir",
        `Ton paiement n'est pas annulé pour autant. Ouvre ${suiviSur} depuis ton navigateur pour voir où il en est.`,
      );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: insets.top + 24,
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── LE MOMENT ─────────────────────────────────────────────────────────────── */}
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={moyen ? `Paiement ${moyen} en attente` : 'Paiement en attente'}
          style={{
            width: CARRE, height: CARRE, borderRadius: RAYON,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: teinte,
            // `0 12px 32px` de la planche, converti : React Native compte le flou en rayon.
            shadowColor: teinte, shadowOpacity: 0.4, shadowRadius: 16,
            shadowOffset: { width: 0, height: 12 }, elevation: 8,
          }}
        >
          {initiales ? (
            <Display size="xs" style={{ fontSize: 28, lineHeight: 32, color: t('paperFixed') }}>
              {initiales}
            </Display>
          ) : (
            <Icon name="clock" size={30} color={t('paperFixed')} />
          )}
          {/* Les deux anneaux. Décoratifs : ils ne portent aucun texte et ne se touchent pas. */}
          <Animated.View
            pointerEvents="none"
            style={[anneau, { transform: [{ scale: echelle(anneauA) }], opacity: voile(anneauA) }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[anneau, { transform: [{ scale: echelle(anneauB) }], opacity: voile(anneauB) }]}
          />
        </View>

        {/*
          Titre en `sm` et non dans la taille d'affichage pleine : `Display` coupe chaque ligne
          à une seule ligne (`numberOfLines={1}`), et à 41 px « est en cours. » déborde d'un
          écran de 360 px — c'est-à-dire se fait rogner sans que rien ne le signale.
        */}
        <Display size="sm" lines={['Ton paiement', 'est en cours.']} style={{ marginTop: 24 }} />

        <Body muted style={{ marginTop: 12 }}>
          Ouvre {moyen ?? 'ton application de paiement'}, valide{' '}
          <Num
            value={aPayer}
            source="server"
            asOf={releve}
            unit="FCFA"
            fallback="le montant affiché à l'étape précédente"
            style={{ fontSize: 14 }}
          />
          , puis reviens ici. Rien ne se décide sur cet écran : c'est le serveur qui enregistre
          le paiement, et il l'enregistre que tu regardes ou non.
        </Body>

        <Surface level="flat" style={{ marginTop: 22, padding: 17 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Body muted style={{ fontSize: 13 }}>Référence</Body>
            <Num
              value={reference ?? null}
              source="server"
              asOf={releve}
              fallback="non transmise"
              style={{ fontSize: 13 }}
            />
          </View>
          <View style={{
            marginTop: 10, flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', gap: 12,
          }}>
            <Body muted style={{ fontSize: 13 }}>Statut</Body>
            <Tag tone="warn">En attente</Tag>
          </View>
        </Surface>

        <Button
          tone="forme"
          label="Vérifier où en est mon paiement"
          disabled={!suiviSur}
          style={{ marginTop: 20 }}
          onPress={() => void ouvrirLeSuivi()}
        />
        <Button
          tone="quiet"
          label="Changer de moyen de paiement"
          style={{ marginTop: 10 }}
          onPress={() => router.back()}
        />

        {!suiviSur ? (
          <Body muted style={{ marginTop: 12, fontSize: 12.5 }}>
            Le lien de suivi ne m'a pas été transmis, donc je ne peux pas te dire où en est
            cette commande depuis ici. Elle se lit dans ton espace, sur le site.
          </Body>
        ) : null}

        <Body muted style={{ marginTop: 14, fontSize: 11.5, textAlign: 'center', color: t('textFaint') }}>
          Je ne te mets pas de compte à rebours : la durée dépend de {moyen ?? 'ton opérateur'},
          pas de moi, et un compteur qui se termine sans réponse ne t'apprend rien.
          {reference ? ' Rien n\'est débité deux fois : chaque paiement porte une référence unique.' : ''}
        </Body>
      </ScrollView>
    </View>
  );
}
