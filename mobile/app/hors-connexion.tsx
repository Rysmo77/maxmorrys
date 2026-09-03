import {
  Body, Display, Eyebrow, Icon, LessonRow, Num, Screen, Surface, Tag, useToken, veil,
} from '../ds';
import { FILE_ENVOI, RELEVE, SOURCE, TELECHARGE } from '../contenu/demo';
import { router } from 'expo-router';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 6 · HORS CONNEXION ══ — LA DIVERGENCE LA PLUS UTILE DU NATIF.
 *
 * EN WEB, C'EST UNE REQUÊTE QUI ÉCHOUE : l'écran arrive après trente secondes d'attente, une
 * fois le délai expiré, et il arrive donc TROP TARD — la personne a déjà conclu que
 * l'application était cassée.
 *
 * EN NATIF, LE SYSTÈME ANNONCE LA COUPURE **AVANT** QU'UNE REQUÊTE SOIT TENTÉE. L'écran est
 * juste dès la première image. Et une seconde chose en découle, qui change le produit :
 *
 *   **LA FILE D'ENVOI DEVIENT UN OBJET PERMANENT**, au lieu d'un rattrapage. Ce qui a été fait
 *   hors réseau est LISTÉ, avec son heure, et il part au retour du réseau sans rien demander.
 *   Une progression qui disparaît parce que le réseau a coupé est la façon la plus sûre de
 *   perdre quelqu'un ; la voir en attente est la façon la plus simple de le rassurer.
 *
 * ⚠️ L'ÉTAT DU RÉSEAU N'EST PAS ENCORE LU. Il demande `expo-network` ou `@react-native-community/netinfo`.
 * Cet écran est donc une DESTINATION, atteinte par le code quand la coupure sera détectée —
 * comme `/erreur`. Le brancher, c'est ajouter un abonnement au démarrage, pas réécrire l'écran.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function HorsConnexion() {
  const t = useToken();

  return (
    <Screen
      territory="informe"
      tabbar
      retour="Cours"
      droite={<Tag tone="stop">Hors connexion</Tag>}
    >
      <Display size={29} lines={['Pas de réseau.']} style={{ marginTop: 6 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Tu peux continuer les{' '}
        <Num value={TELECHARGE.length} source={SOURCE} asOf={RELEVE} style={{ fontSize: 14.5 }} />
        {' '}leçons déjà téléchargées. Ta progression partira dès que tu retrouves du réseau.
      </Body>

      <Eyebrow style={{ marginTop: 22 }}>Disponible sans réseau</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {TELECHARGE.map((l, i) => (
          <LessonRow
            key={l.titre}
            state={'doc' in l && l.doc ? 'todo' : 'done'}
            icon={'doc' in l && l.doc ? <Icon name="doc" size={13} color={t('ink2')} /> : undefined}
            title={l.titre}
            meta={l.meta}
            onPress={() => router.push('/lecon')}
            last={i === TELECHARGE.length - 1}
          />
        ))}
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>En attente d'envoi</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {FILE_ENVOI.map((f, i) => (
          <LessonRow
            key={f.titre}
            icon={<Icon name={f.glyphe} size={13} color={t('mmOrangeT')} strokeWidth={f.glyphe === 'check' ? 3.4 : 2.2} />}
            iconBackground={veil(t('mmOrange'), 0.18)}
            title={f.titre}
            meta={f.meta}
            trailing={<Tag tone="warn">en file</Tag>}
            last={i === FILE_ENVOI.length - 1}
          />
        ))}
      </Surface>

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
        La file part au retour du réseau, sans rien te demander. Le parcours survit à une
        session interrompue et reprise des jours plus tard.
      </Body>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Ce que l'app sait, et que le site ignorait</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Le système annonce la perte de réseau{' '}
          <Body style={{ fontWeight: '700', fontSize: 12.5 }}>avant</Body> qu'une requête
          échoue. Cet écran est donc juste dès la première image, au lieu d'apparaître après
          trente secondes d'attente.
        </Body>
      </Surface>
    </Screen>
  );
}
