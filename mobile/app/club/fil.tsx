import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, EmptyState, Eyebrow, Icon, Surface, useToken } from '../../ds';
import { Bilan, ClubScreen } from './_layout';

/**
 * ── 2 · LE FIL ────────────────────────────────────────────────────────────────────────
 *
 * LE BILAN EST EN TÊTE, ET C'EST L'ARGUMENT DE L'ÉCRAN. Un abonnement annuel ne supprime
 * pas le renoncement, il le concentre sur un instant : onze mois de silence, puis
 * 19 900 F d'un coup. Le bilan est donc permanent, pas terminal — il ouvre le fil chaque
 * fois qu'on l'ouvre, et pas seulement la semaine de l'échéance.
 *
 * ET IL N'Y A AUCUNE PUBLICATION SUR CET ÉCRAN. C'est la règle la plus stricte du lot, et
 * le fil est l'endroit qui la rend évidente : une publication inventée n'est pas une case
 * vide remplie, elle est ATTRIBUÉE à quelqu'un. Un nom, un métier, un quartier, une
 * réussite chiffrée. Personne n'a écrit ça, et le fil le prétendrait.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function ClubFil() {
  const t = useToken();
  const router = useRouter();

  return (
    <ClubScreen titre="Le fil">
      {/* ENGAGEMENT 1 — le bilan ouvre le fil, toute l'année. */}
      <Bilan />

      <Eyebrow style={{ marginTop: 22 }}>Aujourd'hui</Eyebrow>

      <Surface level="flat" style={{ marginTop: 10, paddingVertical: 6 }}>
        <EmptyState
          glyph={<Icon name="comment" size={24} color={t('mmVioletT')} />}
          title="Le fil n'est pas encore branché"
          body="Ce port natif rend la place du fil, pas ses publications. Je n'en fabrique aucune, et c'est délibéré : un message inventé ici porterait le nom, le métier et le quartier de quelqu'un qui ne l'a jamais écrit. Les publications viendront du même compte que sur le site."
          action={
            <Button
              tone="transforme"
              label="Ouvrir les discussions"
              onPress={() => router.push('/club/discussions')}
            />
          }
        />
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="send" size={18} color={t('ink2')} />
          <Body style={{ flex: 1, fontWeight: '700' }}>Le bouton de publication n'est pas posé</Body>
        </View>
        <Body muted style={{ marginTop: 8, fontSize: 13 }}>
          Il n'a rien où écrire tant que le fil n'est pas branché, et un bouton qui ne fait
          rien est pire que son absence. Il arrivera avec le fil, pas avant.
        </Body>
      </Surface>

      {/* La raison, écrite sur l'écran plutôt que gardée dans une note de conception. */}
      <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Pourquoi ce bilan est en tête</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Un abonnement annuel ne supprime pas le renoncement, il le concentre sur un instant.
          Le bilan est donc permanent, pas terminal.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
