import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, Num, Screen, Surface, useToken,
} from '../ds';
import { RELEVE, SOURCE } from '../contenu/demo';

/**
 * ══ 5 · L'ERREUR ══ — MOTIF, CONSÉQUENCE, SORTIE. DANS CET ORDRE, ET JAMAIS D'EXCUSE.
 *
 * L'ordre n'est pas rhétorique, il suit ce que la personne se demande :
 *
 *   1 · LE MOTIF        « pourquoi ça n'a pas marché » — un fait, pas « une erreur est survenue ».
 *   2 · LA CONSÉQUENCE  « qu'est-ce que j'ai perdu » — presque toujours : rien, et il faut le dire.
 *   3 · LA SORTIE       « qu'est-ce que je fais maintenant » — deux, dont une qui marche hors réseau.
 *
 * « Désolé » n'apporte rien : ça occupe la ligne où devrait être le motif.
 *
 * ── LA SORTIE DE SECOURS DU NATIF EST MEILLEURE QUE CELLE DU WEB ─────────────────────────
 * La transcription est DÉJÀ sur l'appareil : 0 Mo à charger, sur l'écran même où le réseau
 * vient de lâcher. C'est le genre de repli qu'un site ne peut pas proposer.
 *
 * ── LA RÉFÉRENCE D'INCIDENT ──────────────────────────────────────────────────────────────
 * Elle est là pour que le support n'ait pas à demander « il s'est passé quoi exactement ? ».
 * Elle vient du serveur ; sans elle, l'écran ne l'invente pas — il n'affiche rien.
 */
export default function Erreur() {
  const t = useToken();
  /*
   * L'ÉCRAN EST PARAMÉTRABLE, parce qu'il est une DESTINATION : `+not-found` y renvoie tout
   * lien profond périmé, et il apporte alors SON motif — « l'adresse ne mène à aucun écran »
   * — qui n'est pas celui d'une vidéo qui n'a pas répondu. Un écran d'erreur qui affiche
   * toujours le même motif est un écran qui n'en donne aucun.
   */
  const { titre, motif, consequence, reference, libelle, sortie } = useLocalSearchParams<{
    titre?: string; motif?: string; consequence?: string;
    reference?: string; libelle?: string; sortie?: string;
  }>();

  /* Un titre d'affichage ne se replie jamais tout seul : celui qui arrive par la route est
     donc coupé au mot le plus proche du milieu, pas laissé libre. */
  const lignes = titre
    ? (() => {
      const mots = titre.split(' ');
      const mi = Math.ceil(mots.length / 2);
      return [mots.slice(0, mi).join(' '), mots.slice(mi).join(' ')];
    })()
    : ["La leçon ne s'est", 'pas chargée.'];

  return (
    <Screen territory="forme" retour="Cours" center>
      <Gradient
        colors={[t('mmCorail'), t('stop')]}
        radius={21}
        style={{
          width: 66, height: 66, alignItems: 'center', justifyContent: 'center',
          shadowColor: t('stop'), shadowOpacity: 0.3, shadowRadius: 15,
          shadowOffset: { width: 0, height: 12 }, elevation: 8,
        }}
      >
        <Icon name="alert" size={28} color={t('paperFixed')} strokeWidth={2.4} />
      </Gradient>

      <Display size={28} lines={lignes} style={{ marginTop: 22 }} />

      <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
        <Eyebrow>Le motif</Eyebrow>
        <Body style={{ marginTop: 7, fontSize: 13.5, lineHeight: 20 }}>
          {motif ?? 'La vidéo a mis plus de 30 secondes à répondre. Le réseau a coupé pendant le transfert.'}
        </Body>
        <View style={{ height: 1, marginVertical: 14, backgroundColor: t('borderHair') }} />
        <Eyebrow>La conséquence</Eyebrow>
        <Body style={{ marginTop: 7, fontSize: 13.5, lineHeight: 20 }}>
          {consequence ?? "Ta progression est intacte : elle est enregistrée sur ton inscription, pas sur le téléphone. Rien n'est perdu."}
        </Body>
      </Surface>

      <Button
        tone="forme"
        label={libelle ?? 'Réessayer'}
        style={{ marginTop: 18 }}
        onPress={() => (sortie ? router.replace(sortie as never) : router.back())}
      />

      {/* LA SORTIE DE SECOURS DU NATIF EST MEILLEURE QUE CELLE DU WEB — mais elle n'a de sens
          que sur une leçon. Un lien mort n'a pas de transcription à proposer. */}
      {sortie ? null : (
        <>
          <Button
            tone="quiet"
            label="Lire la transcription à la place"
            style={{ marginTop: 9 }}
            onPress={() => router.replace('/lecon')}
          />
          <Body muted style={{ fontSize: 11.5, textAlign: 'center', lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
            La transcription est déjà sur ton téléphone :{' '}
            <Num value="0 Mo" source={SOURCE} asOf={RELEVE} style={{ fontSize: 11.5, color: t('textMuted') }} />
            {' '}à charger.
          </Body>
        </>
      )}

      {/* La référence ne s'invente pas : sans elle, la ligne n'existe pas. */}
      {reference ? (
        <Num
          value={`Référence de l'incident : ${reference}`}
          source="server"
          asOf={new Date()}
          style={{ fontSize: 11, textAlign: 'center', marginTop: 10, color: t('textFaint') }}
        />
      ) : null}
    </Screen>
  );
}
