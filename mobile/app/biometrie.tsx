import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, CheckLine, Display, Eyebrow, Gradient, Icon, isIOS, Screen, Surface, useToken,
} from '../ds';
import { useVerrou } from '../donnees/verrou';

/**
 * ══ 9 · BIOMÉTRIE ══
 *
 * PROPOSÉE APRÈS LA PREMIÈRE CONNEXION RÉUSSIE, JAMAIS AVANT. Demander l'empreinte à
 * quelqu'un qui n'a pas encore de compte n'a aucun sens : il n'y a rien à déverrouiller.
 * C'est pour ça que cet écran arrive ici et pas au lancement.
 *
 * ET ELLE NE REMPLACE PAS LE MOT DE PASSE — elle évite de le retaper. La nuance n'est pas
 * rhétorique : quelqu'un qui croit que son empreinte a REMPLACÉ son mot de passe cesse de le
 * retenir, et se retrouve dehors le jour où il change de téléphone.
 *
 * LA QUATRIÈME LIGNE EST UN TIRET, PAS UNE COCHE. Elle dit ce que la biométrie NE protège
 * pas : la vérification d'un certificat est publique, à dessein — c'est ce qui permet à un
 * employeur de la contrôler sans compte.
 *
 * ⚠️ CE BOUTON NAVIGUAIT AU LIEU D'AGIR. « Activer Face ID » appelait `router.replace` et
 * rien d'autre : l'écran posait la question, personne n'enregistrait la réponse, et aucun
 * verrou n'existait. Ce n'était pas un bouton mort au sens de la porte existante — il AVAIT
 * une action — mais ce n'était pas celle qu'il annonçait, ce qui est pire : on repartait en
 * croyant avoir posé un verrou. Le geste système est branché maintenant
 * (`donnees/verrou.ts`), et l'écran ne PROPOSE plus rien quand l'appareil ne peut pas tenir
 * la promesse — proposer un verrou impossible à poser serait exactement le réglage qui ment
 * que l'en-tête ci-dessus reproche.
 */
export default function Biometrie() {
  const t = useToken();
  const { actif, capacite, occupe, activer, desactiver } = useVerrou();

  async function poser() {
    const verdict = await activer();
    if (verdict.ok) {
      router.replace('/(tabs)');
      return;
    }
    /* Le motif est DIT. Un échec silencieux laisserait croire que le bouton est mort — le
       défaut qu'on vient précisément de corriger. */
    Alert.alert("Le verrou n'a pas été posé", verdict.motif);
  }

  return (
    <Screen territory="transforme" center>
      <Gradient
        colors={[t('mmTealN'), t('mmBleu')]}
        radius={21}
        style={{
          width: 66, height: 66, alignItems: 'center', justifyContent: 'center',
          shadowColor: t('mmBleu'), shadowOpacity: 0.3, shadowRadius: 15,
          shadowOffset: { width: 0, height: 12 }, elevation: 8,
        }}
      >
        <Icon name="lock" size={27} color={t('paperFixed')} strokeWidth={2.2} />
      </Gradient>

      <Display
        size={29}
        lines={isIOS ? ['ENTRER AVEC', 'FACE ID ?'] : ['ENTRER AVEC', 'TON EMPREINTE ?']}
        style={{ marginTop: 22 }}
      />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Tu n'auras plus à retaper ton mot de passe. Il reste valable — c'est juste un
        raccourci, pas un remplacement.
      </Body>

      <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
        <CheckLine tone="ok" style={{ marginTop: 0 }}>Ton mot de passe continue de fonctionner</CheckLine>
        <CheckLine tone="ok">
          {isIOS
            ? 'Face ID reste sur ton iPhone : je ne le reçois jamais'
            : 'Ton empreinte reste dans le téléphone : je ne la reçois jamais'}
        </CheckLine>
        <CheckLine tone="ok">Désactivable à tout moment dans ton profil</CheckLine>
        <CheckLine tone="neutre" dash>
          Ça ne protège pas la vérification d'un certificat — elle est publique, à dessein
        </CheckLine>
      </Surface>

      {/*
        TROIS ÉTATS, ET UN SEUL JEU DE BOUTONS À LA FOIS.

        · le matériel n'a pas encore répondu → le bouton existe, éteint. Il ne ment pas : il
          ne promet rien tant qu'on ne sait pas ;
        · l'appareil ne peut pas → AUCUNE proposition, et la raison écrite ;
        · le verrou est déjà posé → on ne le repropose pas, on offre de l'éteindre.
      */}
      {capacite !== null && capacite.etat !== 'pret' ? (
        <>
          <Surface level="truth" style={{ marginTop: 20, padding: 15 }}>
            <Eyebrow>Pas sur ce téléphone</Eyebrow>
            <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
              {capacite.motif}
            </Body>
          </Surface>
          <Button
            tone="quiet"
            label="Continuer"
            style={{ marginTop: 18 }}
            onPress={() => router.replace('/(tabs)')}
          />
        </>
      ) : actif ? (
        <>
          <Button
            tone="digitalise"
            label="C'est bon"
            style={{ marginTop: 18 }}
            onPress={() => router.replace('/(tabs)')}
          />
          <Button
            tone="quiet"
            label={isIOS ? 'Désactiver Face ID' : "Désactiver l’empreinte"}
            style={{ marginTop: 9 }}
            disabled={occupe}
            onPress={() => { void desactiver(); }}
          />
        </>
      ) : (
        <>
          <Button
            tone="digitalise"
            label={isIOS ? 'Activer Face ID' : "Activer l’empreinte"}
            style={{ marginTop: 18 }}
            disabled={capacite === null || occupe}
            onPress={() => { void poser(); }}
          />
          <Button tone="quiet" label="Non merci" style={{ marginTop: 9 }} onPress={() => router.replace('/(tabs)')} />
        </>
      )}

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Pourquoi cette question arrive maintenant</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Parce que tu viens de te connecter, et que c'est le seul moment où la proposition a
          un sens. La poser à l'ouverture de l'app, avant même un compte, c'est demander une
          empreinte pour rien.
        </Body>
      </Surface>
    </Screen>
  );
}
