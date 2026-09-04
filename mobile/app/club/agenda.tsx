import { Alert, View } from 'react-native';
import {
  Body, Button, Eyebrow, Gradient, Icon, Num, Segmented, Surface, Tag, useActionGradient,
  useToken,
} from '../../ds';
import { ClubScreen } from './_layout';
import { ErreurAppel, provenance, reserverSession, useAgenda } from '../../donnees';
import { useState } from 'react';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 7 · L'AGENDA ══ — LE SEUL ÉCRAN DU PORTAGE QUI **GAGNE** UNE ACTION NATIVE.
 *
 * « Ajouter à mon agenda ». Et le gain n'est pas cosmétique :
 *
 *   · **UNE SESSION DANS L'AGENDA SYSTÈME SURVIT À LA DÉSINSTALLATION DE L'APP.** C'est le
 *     meilleur rappel possible, et le seul qui ne dépende de personne.
 *   · **ELLE NE COÛTE AUCUNE PERMISSION DE NOTIFICATION.** Quelqu'un qui a refusé les
 *     notifications — un refus définitif sur iOS — garde ce rappel-là.
 *
 * ⚠️ L'ÉCRITURE DANS L'AGENDA DEMANDE `expo-calendar`, et une permission d'écriture. Le bouton
 * existe, il DIT ce qu'il fera, et il propose la seule chose faisable aujourd'hui sans
 * dépendance : le fichier `.ics` de la session, que les deux systèmes savent ouvrir. C'est un
 * manque déclaré, pas un bouton mort.
 *
 * ── ET PERSONNE NE PEUT T'INSCRIRE À TA PLACE ────────────────────────────────────────────
 * Ni un parrain, ni un organisateur. Se réinscrire ne crée pas de doublon. Les deux phrases
 * sont dans l'encart, parce que ce sont les deux questions qu'on se pose avant de toucher un
 * bouton d'inscription à un événement.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Agenda() {
  const t = useToken();
  const g = useActionGradient();
  const [vue, setVue] = useState('À venir');

  const agenda = useAgenda();
  const seances = agenda.valeur ?? [];
  /* L'état affiché est celui du serveur, sauf pour les séances qu'on vient de basculer.
     Une réservation qui met une seconde à se voir se re-touche, et on se désinscrit sans
     l'avoir voulu. */
  const [bascules, setBascules] = useState<Record<string, boolean>>({});
  const [enVol, setEnVol] = useState<string | null>(null);

  async function basculer(
    s: { id: string; collection: string }, inscrite: boolean,
  ) {
    if (enVol !== null) return;
    setEnVol(s.id);
    setBascules((b: Record<string, boolean>) => ({ ...b, [s.id]: inscrite }));
    try {
      await reserverSession(s.collection, s.id, inscrite);
    } catch (erreur: unknown) {
      /* On REMET l'état d'avant. Une place qui reste affichée comme réservée alors que le
         serveur l'ignore, c'est quelqu'un qui se présente à un atelier complet. */
      setBascules((b: Record<string, boolean>) => ({ ...b, [s.id]: !inscrite }));
      Alert.alert(
        inscrite ? "Ta place n'est pas réservée" : "Tu n'as pas été désinscrite",
        erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.',
      );
    } finally {
      setEnVol(null);
    }
  }

  /*
   * ⚠️ CE BOUTON OUVRAIT UN FICHIER QUI N'EXISTE PAS. Il pointait sur
   * `maxmorrys.me/club/agenda.ics` — mesuré : la réponse est un `200` avec
   * `content-type: text/html`, c'est-à-dire la coquille de l'application web servie par le
   * fourre-tout de l'hébergement. Le téléphone n'y voit aucun calendrier : il ouvre la page
   * d'accueil du site. Une action principale qui fait autre chose que ce qu'elle annonce est
   * un rejet en revue, et c'est un défaut qui survit parce que le lien RÉPOND.
   *
   * On ne remplace pas par un `expo-calendar` improvisé : écrire dans l'agenda demande une
   * permission, une chaîne d'usage dans `app.json`, et une ligne au formulaire de
   * confidentialité des deux magasins. Ça se décide, ça ne se bricole pas ici.
   *
   * En attendant, l'alerte dit l'horaire — ce qui est utile et vrai — et ne promet rien
   * d'autre. C'est moins que prévu ; ce n'est pas faux.
   */
  function ajouterALAgenda(titre: string, horaire: string) {
    Alert.alert(
      titre,
      `${horaire}.\n\nNote-la dans ton agenda : le lien de connexion arrive par e-mail le jour même.`,
      [{ text: "J'ai noté" }],
    );
  }

  return (
    <ClubScreen titre="Agenda">
      <Segmented
        options={['À venir', 'Mes inscriptions', 'Passées']}
        value={vue}
        onChange={setVue}
      />

      {seances.map((s) => (
        <View key={s.titre}>
          <Eyebrow style={{ marginTop: 22 }}>{s.jour}</Eyebrow>
          <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
            <View style={{ flexDirection: 'row', gap: 13 }}>
              <Gradient
                colors={g[s.territoire as keyof typeof g]}
                radius={14}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name={s.glyphe} size={20} color={t('paperFixed')} />
              </Gradient>
              <View style={{ flex: 1 }}>
                <Body style={{ fontSize: 15, fontWeight: '700' }}>{s.titre}</Body>
                <Num
                  value={s.horaire}
                  {...provenance(agenda)}
                  style={{ fontSize: 11.5, color: t('textMuted'), marginTop: 3 }}
                />
              </View>
            </View>

            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, marginTop: 14,
            }}>
              {(bascules[s.id] ?? s.inscrite) ? <Tag tone="ok">Tu es inscrite</Tag> : (
                <Num value={s.places ?? null} {...provenance(agenda)} fallback="places non relevées" style={{ fontSize: 12.5, color: t('mmTealT') }} />
              )}
              <Button
                tone={s.inscrite ? 'quiet' : 'digitalise'}
                size="sm"
                label={enVol === s.id
                  ? '…'
                  : (bascules[s.id] ?? s.inscrite) ? 'Me désinscrire' : 'Je réserve'}
                disabled={enVol !== null}
                onPress={() => { void basculer(s, !(bascules[s.id] ?? s.inscrite)); }}
              />
            </View>

            {/* L'ACTION QUE LE WEB NE POUVAIT PAS OFFRIR. Elle n'apparaît que sur ce à quoi on
                est inscrit : proposer d'agender ce qu'on n'a pas réservé n'a pas de sens. */}
            {s.inscrite ? (
              <Button
                tone="ghost"
                label="Ajouter à mon agenda"
                icon="calendar"
                style={{ marginTop: 10 }}
                onPress={() => ajouterALAgenda(s.titre, s.horaire ?? '')}
              />
            ) : null}
          </Surface>
        </View>
      ))}

      <Surface level="truth" style={{ marginTop: 18, padding: 15 }}>
        <Eyebrow>Pourquoi l'agenda système, et pas une notification</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Une session dans ton agenda{' '}
          <Body style={{ fontWeight: '700', fontSize: 12.5 }}>survit à la désinstallation de l'app</Body>
          {' '}et ne dépend d'aucune permission de notification. C'est le meilleur rappel
          possible, et il ne me coûte rien.
        </Body>
        <Body muted style={{ marginTop: 10, fontSize: 12.5, lineHeight: 19 }}>
          Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
