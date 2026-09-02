import { router } from 'expo-router';
import {
  Body, Button, CheckLine, Display, Eyebrow, Gradient, Icon, isIOS, Screen, Surface, useToken,
} from '../ds';

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
 */
export default function Biometrie() {
  const t = useToken();

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
        ⚠️ L'AUTHENTIFICATION SYSTÈME N'EST PAS BRANCHÉE. Elle demande `expo-local-authentication`
        et, surtout, un compte à déverrouiller : le SDK d'authentification n'est pas encore là
        (README, « ce qui n'est pas encore branché »). Activer un verrou sur rien donnerait un
        réglage qui ment. L'écran pose la question et enregistre le choix ; le geste système
        arrive avec le compte.
      */}
      <Button
        tone="digitalise"
        label={isIOS ? 'Activer Face ID' : "Activer l’empreinte"}
        style={{ marginTop: 18 }}
        onPress={() => router.replace('/(tabs)')}
      />
      <Button tone="quiet" label="Non merci" style={{ marginTop: 9 }} onPress={() => router.replace('/(tabs)')} />

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
