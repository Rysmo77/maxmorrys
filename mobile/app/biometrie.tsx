import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, CheckLine, Display, Eyebrow, Gradient, Heros, Icon, Revele, Screen, Surface, haptique,
  isIOS, useBandeau, useToken,
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
  const { bandeau, montrer } = useBandeau();
  /* Le geste RÉEL de l'appareil — « Face ID », « Touch ID », « ton empreinte ». Il était
     écrit en dur : Face ID sur un iPhone à capteur d'empreinte. */
  const geste = capacite?.etat === 'pret' ? capacite.geste : isIOS ? 'Face ID' : 'ton empreinte';

  /* ── LA CONFIRMATION. Le verrou posé, l'écran partait aussitôt : on ne savait pas si
     c'était fait. La coche apparaît, le téléphone vibre, et l'Espace suit. ── */
  const [pose, setPose] = useState(false);
  useEffect(() => {
    if (!pose) return undefined;
    const m = setTimeout(() => router.replace('/nommer'), 1100);
    return () => clearTimeout(m);
  }, [pose]);

  async function poser() {
    const verdict = await activer();
    if (verdict.ok) {
      haptique.succes();
      setPose(true);
      return;
    }
    /* Le motif est DIT. Un échec silencieux laisserait croire que le bouton est mort. */
    montrer('stop', "Le verrou n'a pas été posé", verdict.motif);
  }

  if (pose) {
    return (
      <Screen territory="transforme" espace="hub" center>
        <Heros>
          <View style={{ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: t('ok') }}>
            <Icon name="check" size={30} color={t('paperFixed')} strokeWidth={3} />
          </View>
        </Heros>
        <Display size={29} lines={["C'EST POSÉ."]} style={{ marginTop: 22 }} />
        <Revele i={1}>
          <Body muted style={{ marginTop: 12, fontSize: 15, lineHeight: 22 }}>
            {`La prochaine fois, ${geste} suffit. Ton mot de passe reste valable.`}
          </Body>
        </Revele>
      </Screen>
    );
  }

  return (
    <Screen territory="transforme" espace="hub" center>
      {bandeau}
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
        lines={['ENTRER AVEC', `${geste.toUpperCase()} ?`]}
        style={{ marginTop: 22 }}
      />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Tu n'auras plus à retaper ton mot de passe. Il reste valable — c'est juste un
        raccourci, pas un remplacement.
      </Body>

      <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
        <CheckLine tone="ok" style={{ marginTop: 0 }}>Ton mot de passe continue de fonctionner</CheckLine>
        <CheckLine tone="ok">
          {`${geste.charAt(0).toUpperCase()}${geste.slice(1)} reste dans ton téléphone : l'application ne le reçoit jamais`}
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
            onPress={() => router.replace('/nommer')}
          />
        </>
      ) : actif ? (
        <>
          <Button
            tone="digitalise"
            label="C'est bon"
            style={{ marginTop: 18 }}
            onPress={() => router.replace('/nommer')}
          />
          <Button
            tone="quiet"
            label={`Ne plus utiliser ${geste}`}
            style={{ marginTop: 9 }}
            disabled={occupe}
            onPress={() => { void desactiver(); }}
          />
        </>
      ) : (
        <>
          <Button
            tone="digitalise"
            label={`Activer ${geste}`}
            style={{ marginTop: 18 }}
            disabled={capacite === null || occupe}
            onPress={() => { void poser(); }}
          />
          <Button tone="quiet" label="Non merci" style={{ marginTop: 9 }} onPress={() => router.replace('/nommer')} />
        </>
      )}
    </Screen>
  );
}
