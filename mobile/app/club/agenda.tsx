import { Alert, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Body, Button, EmptyState, Eyebrow, Fondu, Gradient, Icon, Num, Revele, SansDonnees, Segmented, Surface, Tag,
  haptique, useActionGradient, useBandeau, useToken,
} from '../../ds';
import { ClubScreen } from './_layout';
import { ErreurAppel, provenance, reserverSession, useAgenda } from '../../donnees';
import { useEffect, useState } from 'react';

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
  /* « Passées » est parti : la vue ne sert que les séances à venir, l'onglet était toujours
     vide. Et le sélecteur ne filtrait RIEN — `vue` n'était jamais lue. */
  const [vue, setVue] = useState('À venir');
  const { bandeau, montrer } = useBandeau();

  const agenda = useAgenda();
  const seances = agenda.valeur ?? [];
  /* L'état affiché est celui du serveur, sauf pour les séances qu'on vient de basculer —
     PARTOUT : le ton du bouton et l'offre de copier l'horaire lisaient encore le serveur. */
  const [bascules, setBascules] = useState<Record<string, boolean>>({});
  const [enVol, setEnVol] = useState<string | null>(null);
  const inscrite = (s: { id: string; inscrite: boolean }) => bascules[s.id] ?? s.inscrite;
  const visibles = vue === 'Mes inscriptions' ? seances.filter(inscrite) : seances;
  const servi = agenda.phase === 'servie' || agenda.phase === 'replique' || agenda.phase === 'vide';

  /* « Place réservée » s'affiche SUR le bouton touché, 1,4 s, puis le bouton redevient
     « Me désinscrire ». */
  const [confirmee, setConfirmee] = useState<string | null>(null);
  const [copiee, setCopiee] = useState<string | null>(null);
  useEffect(() => {
    if (confirmee === null && copiee === null) return undefined;
    const m = setTimeout(() => { setConfirmee(null); setCopiee(null); }, 1400);
    return () => clearTimeout(m);
  }, [confirmee, copiee]);

  async function basculer(s: { id: string; collection: string; titre: string }, suivante: boolean) {
    if (enVol !== null) return;
    setEnVol(s.id);
    setBascules((b: Record<string, boolean>) => ({ ...b, [s.id]: suivante }));
    try {
      await reserverSession(s.collection, s.id, suivante);
      haptique.succes();
      if (suivante) setConfirmee(s.id);
    } catch (erreur: unknown) {
      /* On REMET l'état d'avant. Une place qui reste affichée comme réservée alors que le
         serveur l'ignore, c'est quelqu'un qui se présente à un atelier complet. */
      setBascules((b: Record<string, boolean>) => ({ ...b, [s.id]: !suivante }));
      montrer(
        'stop',
        suivante ? "Ta place n'est pas réservée" : "Ta désinscription n'est pas passée",
        erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.',
      );
    } finally {
      setEnVol(null);
    }
  }

  /* Se désinscrire libère une place qu'un autre membre peut prendre : on le confirme. */
  function desinscrire(s: { id: string; collection: string; titre: string }) {
    haptique.attention();
    Alert.alert(
      'Libérer ta place ?',
      `${s.titre}. Un autre membre pourra la prendre.`,
      [
        { text: 'Garder ma place', style: 'cancel' },
        { text: 'Me désinscrire', style: 'destructive', onPress: () => { void basculer(s, false); } },
      ],
    );
  }

  /*
   * ⚠️ « AJOUTER À MON AGENDA » N'AJOUTAIT RIEN. Il ouvrait une alerte qui disait l'horaire,
   * sous un encart qui vantait « l'agenda système, qui survit à la désinstallation ». Écrire
   * dans l'agenda demande `expo-calendar`, une permission et une ligne aux formulaires de
   * confidentialité : ça se décide. En attendant, l'horaire se COPIE — c'est vrai, et c'est
   * ce qu'on fait pour le coller dans son agenda.
   */
  async function copierHoraire(s: { id: string; titre: string; horaire?: string | null }) {
    await Clipboard.setStringAsync(`${s.titre} — ${s.horaire ?? ''}`);
    haptique.succes();
    setCopiee(s.id);
  }

  return (
    <ClubScreen titre="Agenda">
      <Segmented options={['À venir', 'Mes inscriptions']} value={vue} onChange={setVue} />
      {bandeau}

      <Fondu cle={vue}>
      {!servi ? (
        <SansDonnees quoi="l'agenda du Club" etat={agenda} hauteur={4} style={{ marginTop: 18 }} />
      ) : visibles.length === 0 ? (
        <Surface level="flat" style={{ marginTop: 18, paddingVertical: 6 }}>
          <EmptyState
            glyph={<Icon name="calendar" size={24} color={t('mmVioletT')} />}
            title={vue === 'Mes inscriptions' ? 'Aucune place réservée' : 'Aucune séance annoncée'}
            body={vue === 'Mes inscriptions'
              ? 'Les séances que tu réserves se retrouvent ici.'
              : 'Les prochaines sessions et ateliers apparaissent ici dès qu’ils sont annoncés.'}
          />
        </Surface>
      ) : visibles.map((s, i) => {
        const place = inscrite(s);
        return (
          <Revele key={s.id} i={i}>
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
                    style={{ fontSize: 12, color: t('textMuted'), marginTop: 3 }}
                  />
                </View>
              </View>

              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, marginTop: 14,
              }}>
                {place ? <Revele echelle><Tag tone="ok">Place réservée</Tag></Revele> : (
                  <Num value={s.places ?? null} {...provenance(agenda)} fallback="places non relevées" style={{ fontSize: 12.5, color: t('mmTealT') }} />
                )}
                <Button
                  tone={place ? 'quiet' : 'digitalise'}
                  size="sm"
                  label={place ? 'Me désinscrire' : 'Je réserve'}
                  confirmation="Place réservée"
                  confirme={confirmee === s.id}
                  disabled={enVol !== null}
                  onPress={() => { if (place) desinscrire(s); else void basculer(s, true); }}
                />
              </View>

              {place ? (
                <>
                  <Button
                    tone="ghost"
                    label="Copier l'horaire"
                    icon="copy"
                    confirmation="Horaire copié"
                    confirme={copiee === s.id}
                    style={{ marginTop: 10 }}
                    onPress={() => { void copierHoraire(s); }}
                  />
                  {/* Seule la session en ligne a un lien qui part par e-mail ; pour un atelier,
                      on n'invente pas un envoi qu'on ne connaît pas. */}
                  {s.collection === 'club_sessions' ? (
                    <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>
                      Le lien de connexion arrive par e-mail le jour même.
                    </Body>
                  ) : null}
                </>
              ) : null}
            </Surface>
          </Revele>
        );
      })}
      </Fondu>

      <Body muted style={{ marginTop: 18, fontSize: 12.5, lineHeight: 19 }}>
        Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.
      </Body>
    </ClubScreen>
  );
}
