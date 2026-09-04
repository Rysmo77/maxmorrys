import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, ChipRow, Display, Eyebrow, Fab, Field, Icon, IconButton, LessonRow, Num, SansDonnees, Screen, Surface, Tag, isIOS, useToken,
} from '../ds';
import { ErreurAppel, ecrireUneNote, provenance, useEspace, useNotes } from '../donnees';

/**
 * ══ 5 · MES NOTES ══
 *
 * ELLES SURVIVENT À LA FIN DU COURS ET SUIVENT D'UN APPAREIL À L'AUTRE. C'est ce qui les
 * distingue d'un surlignage : une note prise pendant la leçon 5 sert encore six mois après,
 * quand la formation est finie et que la boutique existe.
 *
 * LE BOUTON D'AJOUT EST FLOTTANT, et c'est le SEUL écran du produit qui en a un — parce que
 * c'est le seul où l'action principale est « en créer une de plus », à n'importe quel endroit
 * de la liste. Sa forme change de plateforme (voir `ds/Fab.tsx`) : c'est la seule divergence
 * de DESSIN du portage.
 *
 * « TOI SEULE LES LIS » EST UNE ÉTIQUETTE, PAS UNE PROMESSE EN PETIT. Elle est à côté du
 * compte, à l'endroit où quelqu'un se demande si ce qu'il écrit va être vu.
 */
export default function Notes() {
  const t = useToken();
  const notes = useNotes();
  const espace = useEspace();
  const [ajoutees, setAjoutees] = useState<Array<{ id: string; texte: string; date: string | null }>>([]);
  const [redaction, setRedaction] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const liste = [...ajoutees, ...(notes.valeur?.notes ?? [])];

  /*
   * ⚠️ L'ÉCRITURE N'EST PAS BRANCHÉE : une note se range sur l'inscription, côté Firestore, et
   * le SDK n'est pas là. Le bouton existe quand même — c'est l'affordance qui décide de la
   * mise en page de tout l'écran. Il DIT ce qui manque au lieu de ne rien faire : un bouton
   * inerte se lit comme une panne, et une panne sans motif se signale au support.
   */
  /*
   * ⚠️ CE BOUTON OUVRAIT UNE ALERTE DISANT QUE L'ÉCRITURE « ARRIVE AVEC TON COMPTE ». Le
   * compte est branché : la phrase était devenue fausse, et un bouton flottant qui n'écrit
   * rien l'est encore plus.
   *
   * ⚠️ ET LA PREMIÈRE CORRECTION ÉTAIT UN PIÈGE. J'avais utilisé `Alert.prompt`, qui
   * N'EXISTE QUE SUR iOS : sur Android, l'appel optionnel n'aurait rien fait du tout —
   * c'est-à-dire exactement le contrôle mort qu'on venait de supprimer, recréé sur une
   * seule plateforme, donc invisible à qui relit sur l'autre.
   *
   * La saisie est donc DANS l'écran. Elle s'ouvre sous la barre, au-dessus de la liste :
   * une note se prend en trois secondes, au milieu d'autre chose, et un écran à part ferait
   * perdre le fil de ce qu'on voulait noter.
   */
  function ecrire() {
    setRedaction((r) => (r === null ? '' : r));
  }

  async function enregistrer(texte: string) {
    if (texte.trim() === '' || enCours) return;
    setEnCours(true);
    try {
      const note = await ecrireUneNote(
        texte,
        espace.valeur?.moduleEnCours
          ? { id: espace.valeur.slug, label: espace.valeur.moduleEnCours }
          : undefined,
      );
      /* On insère EN TÊTE : la liste est triée du plus récent au plus ancien, et relire le
         serveur pour constater ce qu'on vient d'écrire coûterait un aller-retour pour
         afficher ce qu'on connaît déjà. */
      setAjoutees((a: typeof ajoutees) => [note, ...a]);
      setRedaction(null);
    } catch (erreur: unknown) {
      Alert.alert(
        "Ta note n'est pas enregistrée",
        erreur instanceof ErreurAppel
          ? `${erreur.motif} Recopie-la avant de quitter l'écran.`
          : "Recopie-la avant de quitter l'écran, elle n'est nulle part.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Screen
      territory="forme"
      tabbar
      retour="Leçon"
      titre={isIOS ? undefined : 'Mes notes'}
      droite={
        <IconButton disabled label="Chercher dans mes notes">
          <Icon name="search" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
      /*
        LE BOUTON FLOTTANT PASSE PAR `overlay`, PAS PAR LE CORPS. Dans le corps, il vivrait
        dans le conteneur défilant : il s'en irait vers le haut au premier glissement, sur
        l'écran même dont il est l'action principale.
      */
      overlay={(
        <Fab label="Écrire une note" territory="forme" onPress={ecrire}>
          <Icon name="plus" size={22} color={t('paperFixed')} strokeWidth={2.6} />
        </Fab>
      )}
    >
      <Eyebrow style={{ marginTop: 6 }}>{espace.valeur?.moduleEnCours ?? 'Tes notes'}</Eyebrow>
      <Display size={27} lines={['Mes notes']} style={{ marginTop: 8 }} />

      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginTop: 10,
      }}>
        {/* Le compte, ou rien. « 0 notes » sans relevé se lirait comme une perte. */}
        <Num
          value={notes.valeur ? `${notes.valeur.total.notes} notes · ${notes.valeur.total.lecons} leçons` : null}
          {...provenance(notes)}
          fallback="compte non relevé"
          style={{ fontSize: 12, color: t('textMuted') }}
        />
        <Tag>Toi seule les lis</Tag>
      </View>

      <ChipRow
        options={['Vidéo', 'Transcription', 'Mes notes', 'Ressources']}
        value="Mes notes"
        onChange={(v) => { if (v !== 'Mes notes') router.back(); }}
        height={36}
        style={{ marginTop: 16 }}
      />

      {/* ── LA SAISIE, DANS L'ÉCRAN ────────────────────────────────────────────────────
          Elle s'ouvre au-dessus de la liste plutôt que sur un écran à part : une note se
          prend au milieu d'autre chose, et changer d'écran fait perdre le fil de ce qu'on
          voulait noter. C'est aussi la seule forme qui marche sur les DEUX plateformes —
          `Alert.prompt` est iOS uniquement. */}
      {redaction === null ? null : (
        <Surface level="flat" style={{ marginTop: 14, padding: 16 }}>
          <Field
            label="Ta note"
            value={redaction}
            onChangeText={setRedaction}
            placeholder="Ce que tu veux retenir de cette leçon."
            multiline
            autoCapitalize="sentences"
            style={{ marginTop: 0 }}
          />
          <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
            <Button
              tone="quiet"
              size="sm"
              label="Annuler"
              disabled={enCours}
              style={{ flex: 1 }}
              onPress={() => setRedaction(null)}
            />
            <Button
              tone="forme"
              size="sm"
              label={enCours ? 'Enregistrement…' : 'Enregistrer'}
              disabled={enCours || redaction.trim() === ''}
              style={{ flex: 1 }}
              onPress={() => { void enregistrer(redaction); }}
            />
          </View>
        </Surface>
      )}

      {/* La liste ne se distingue plus d'un vide par sa longueur mais par sa PHASE : une
          liste jamais lue et une liste vraiment vide n'ont pas la même chose à dire. */}
      {liste.length === 0 ? (
        <SansDonnees
          quoi="tes notes"
          degat="Une note inventée met une phrase dans ta bouche. C'est le seul contenu du produit que personne d'autre que toi n'a écrit."
          etat={notes}
          hauteur={3}
          style={{ marginTop: 14 }}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
          {liste.map((n, i) => (
            <LessonRow
              key={n.id}
              icon={<Icon name="comment" size={14} color={t('ink2')} />}
              title={n.texte}
              meta={n.date ?? undefined}
              trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
              last={i === liste.length - 1}
            />
          ))}
        </Surface>
      )}

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Ce qu'elles deviennent</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrire une
          note rapporte de l'expérience ; la rééditer n'en rapporte pas.
        </Body>
      </Surface>

    </Screen>
  );
}
