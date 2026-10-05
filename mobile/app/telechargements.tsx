import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, LessonRow, Num, ProgressBar, Screen, Surface, Switch, useToken, veil,
} from '../ds';
import { reglerWifiSeul, retirerLecon, useHorsLigne } from '../donnees/hors-ligne';
import { PLAFOND_OCTETS, poids, totalOctets } from '../donnees/garde';

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
 *
 * ⓘ BRANCHÉ LE 05/10/2026. Cet écran n'affichait que du contenu de démonstration (« 3 leçons »,
 * un poids et une « qualité vidéo 480p » inventés) et ses boutons étaient éteints. Il lit
 * maintenant ce que `hors-ligne.ts` a réellement écrit. La ligne « Qualité des vidéos » a
 * disparu : les vidéos sont des intégrations, elles ne se téléchargent pas — régler leur
 * qualité aurait été un réglage sans effet.
 */
export default function Telechargements() {
  const t = useToken();
  const { uid, gardees, wifiSeul } = useHorsLigne();
  const total = totalOctets(gardees);
  /* L'appareil est la SOURCE de ces nombres : ils sont mesurés à l'écriture, maintenant. */
  const maintenant = new Date();

  function toutRetirer() {
    Alert.alert('Tout retirer du téléphone ?', 'Ta progression et tes notes ne bougent pas : elles vivent sur ton compte.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout retirer', style: 'destructive', onPress: () => { void Promise.all(gardees.map((g) => retirerLecon(g.cle))); } },
    ]);
  }

  return (
    <Screen territory="forme" retour="Profil" titre="Téléchargements">
      <Eyebrow style={{ marginTop: 6 }}>
        {gardees.length === 0 ? 'Aucune leçon hors connexion' : `${gardees.length} ${gardees.length > 1 ? 'leçons' : 'leçon'} hors connexion`}
      </Eyebrow>
      <Display size={27} lines={gardees.length === 0 ? ['Rien de gardé', 'sur ce téléphone.'] : [poids(total), 'sur ton téléphone']} style={{ marginTop: 8 }} />

      <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontSize: 14, fontWeight: '600' }}>Télécharger en Wi-Fi seulement</Body>
            <Body muted style={{ fontSize: 12, marginTop: 2 }}>Pour ne pas entamer ton forfait.</Body>
          </View>
          <Switch on={wifiSeul} label="Télécharger en Wi-Fi seulement" onPress={() => { if (uid) void reglerWifiSeul(!wifiSeul); }} />
        </View>
      </Surface>

      <Eyebrow style={{ marginTop: 24 }}>Sur cet appareil</Eyebrow>
      {gardees.length === 0 ? (
        <Body muted style={{ marginTop: 10, fontSize: 13.5, lineHeight: 20 }}>
          Dans une leçon, la flèche en haut à droite la garde ici : son texte se lit ensuite sans
          réseau.
        </Body>
      ) : (
        <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
          {[...gardees].sort((a, b) => b.gardeeLe.localeCompare(a.gardeeLe)).map((l, i, liste) => (
            <LessonRow
              key={l.cle}
              state="done"
              title={l.titre}
              meta={[poids(l.octets), l.videoEnLigne ? 'vidéo en ligne seulement' : null].filter(Boolean).join(' · ')}
              onPress={() => router.push({ pathname: '/lecon', params: { formationId: l.formationId, leconId: l.leconId } })}
              last={i === liste.length - 1}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer du téléphone : ${l.titre}`}
                  onPress={() => { void retirerLecon(l.cle); }}
                  hitSlop={4}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: veil(t('stop'), 0.1) }}
                >
                  <Icon name="trash" size={14} color={t('stop')} strokeWidth={2.2} />
                </Pressable>
              }
            />
          ))}
        </Surface>
      )}

      <Surface level="flat" style={{ marginTop: 14, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <Body muted style={{ fontSize: 13.5 }}>Total occupé</Body>
          <Num value={poids(total)} source={{ cite: 'mesuré sur cet appareil' }} asOf={maintenant} style={{ fontSize: 21 }} />
        </View>
        <ProgressBar value={Math.min(100, (total / PLAFOND_OCTETS) * 100)} style={{ marginTop: 12 }} />
        <Body muted style={{ fontSize: 11.5, marginTop: 8, color: t('textFaint') }}>
          sur {poids(PLAFOND_OCTETS)} que l'app s'autorise. Au-delà, elle retire d'abord la leçon
          gardée depuis le plus longtemps — et te dit laquelle.
        </Body>
        {gardees.length > 0 ? <Button tone="quiet" label="Tout retirer" style={{ marginTop: 14 }} onPress={toutRetirer} /> : null}
      </Surface>

      <Surface level="truth" style={{ marginTop: 12, padding: 15 }}>
        <Eyebrow>Ce que retirer ne touche pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Ta progression, tes notes et tes certificats vivent sur ton compte, pas sur le
          téléphone. Retirer une leçon ne fait que la retélécharger plus tard.
        </Body>
      </Surface>
    </Screen>
  );
}
