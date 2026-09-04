import { Pressable, View } from 'react-native';
import {
  Body, Button, Display, Eyebrow, Icon, LessonRow, Num, ProgressBar, SansDonnees, Screen, Surface, Switch, useToken, veil,
} from '../ds';
import { RELEVE, SOURCE, STOCKAGE, TELECHARGE } from '../contenu/demo';
import { useState } from 'react';

/**
 * ══ 5 · TÉLÉCHARGEMENTS ET STOCKAGE ══
 *
 * DEUX FAITS DU MARCHÉ VISÉ DÉCIDENT DE TOUT CET ÉCRAN : le forfait est compté, et l'appareil
 * est petit. D'où deux choses qu'aucune application de cours n'affiche d'habitude :
 *
 *   · CHAQUE POIDS EST ÉCRIT, par leçon ET en total. « 3 leçons hors connexion » ne dit rien
 *     à quelqu'un qui arbitre entre un cours et des photos ; « 21 Mo » le dit.
 *   · LE PLAFOND EST AUTO-IMPOSÉ, et l'application dit ce qu'elle supprime en premier quand
 *     elle l'atteint. Une application qui grossit en silence finit désinstallée pour ça.
 *
 * LE WI-FI PAR DÉFAUT N'EST PAS UN RÉGLAGE DE CONFORT. Télécharger sur les données mobiles
 * sans le demander, c'est dépenser l'argent de quelqu'un d'autre.
 */
export default function Telechargements() {
  const t = useToken();
  const [wifi, setWifi] = useState(true);

  if (STOCKAGE === null) {
    return (
      <Screen territory="forme" retour="Profil" titre="Téléchargements">
        <Display size={27} lines={['Rien de gardé', 'sur ce téléphone.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="ce que tu as téléchargé"
          origine="de cet appareil"
          degat="Un poids inventé décide à ta place de charger ou d'attendre le Wi-Fi. Sur un forfait compté, c'est le chiffre qui coûte le plus cher à se tromper."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure quand la liaison vient d'un
     autre module : `onPress={() => X.y}` reperd le `non null` que la garde vient
     d'établir. Une constante LOCALE le porte jusque dans les rappels. */
  const stockage = STOCKAGE;
  return (
    <Screen territory="forme" retour="Profil" titre="Téléchargements">
      <Eyebrow style={{ marginTop: 6 }}>
        {TELECHARGE.length} leçons hors connexion
      </Eyebrow>
      <Display size={27} lines={[stockage.occupeCourt, 'sur ton téléphone']} style={{ marginTop: 8 }} />

      <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontSize: 14, fontWeight: '600' }}>Télécharger en Wi-Fi seulement</Body>
            <Body muted style={{ fontSize: 12, marginTop: 2 }}>Pour ne pas entamer ton forfait.</Body>
          </View>
          <Switch on={wifi} label="Télécharger en Wi-Fi seulement" onPress={() => setWifi(!wifi)} />
        </View>
        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontSize: 14, fontWeight: '600' }}>Qualité des vidéos</Body>
            <Body muted style={{ fontSize: 12, marginTop: 2 }}>480p suffit pour un cours parlé.</Body>
          </View>
          <Num value={stockage.qualite} source={SOURCE} asOf={RELEVE} style={{ fontSize: 13, color: t('textMuted') }} />
        </View>
      </Surface>

      <Eyebrow style={{ marginTop: 24 }}>Sur cet appareil</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {TELECHARGE.map((l, i) => (
          <LessonRow
            key={l.titre}
            state="done"
            title={l.titre}
            meta={l.meta}
            last={i === TELECHARGE.length - 1}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Supprimer : ${l.titre}`}
                disabled
                hitSlop={4}
                style={{
                  width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: veil(t('stop'), 0.1),
                }}
              >
                <Icon name="trash" size={14} color={t('stop')} strokeWidth={2.2} />
              </Pressable>
            }
          />
        ))}
      </Surface>

      <Surface level="flat" style={{ marginTop: 14, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <Body muted style={{ fontSize: 13.5 }}>Total occupé</Body>
          <Num value={stockage.occupe} source={SOURCE} asOf={RELEVE} style={{ fontSize: 21 }} />
        </View>
        <ProgressBar value={stockage.pourcentage} style={{ marginTop: 12 }} />
        <Body muted style={{ fontSize: 11.5, marginTop: 8, color: t('textFaint') }}>
          sur {stockage.plafond} que l'app s'autorise. Au-delà, elle supprime d'abord les
          leçons déjà terminées.
        </Body>
        <Button tone="quiet" label="Tout supprimer" disabled style={{ marginTop: 14 }} />
      </Surface>

      <Surface level="truth" style={{ marginTop: 12, padding: 15 }}>
        <Eyebrow>Ce que supprimer ne touche pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Ta progression, tes notes et tes certificats vivent sur ton compte, pas sur le
          téléphone. Vider le stockage ne fait que retélécharger plus tard.
        </Body>
      </Surface>
    </Screen>
  );
}
