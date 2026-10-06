import { useState } from 'react';
import { View } from 'react-native';
import {
  Body, Button, Display, Eyebrow, Fab, Feuille, Field, Icon, LessonRow, Num, Revele, SansDonnees, Screen, Surface, Tag,
  haptique, isIOS, useBandeau, useToken,
} from '../ds';
import { ErreurAppel, ecrireUneNote, provenance, useEspace, useNotes } from '../donnees';
import { BandeauHorsLigne } from '../ecrans/BandeauHorsLigne';

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
  const [ajoutees, setAjoutees] = useState<Array<{ id: string; texte: string; date: string | null; enFile?: true }>>([]);
  const [redaction, setRedaction] = useState<string | null>(null);
  const { bandeau, montrer } = useBandeau();
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
      haptique.succes();
    } catch (erreur: unknown) {
      montrer(
        'stop',
        "Ta note n'est pas enregistrée",
        erreur instanceof ErreurAppel ? `${erreur.motif} Elle est encore dans le champ.` : 'Elle est encore dans le champ.',
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Screen
      territory="forme"
      retour="Retour"
      titre={isIOS ? undefined : 'Mes notes'}
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
      <BandeauHorsLigne />
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
        <Tag>Visibles par toi uniquement</Tag>
      </View>

      {/* La rangée « Vidéo · Transcription · Mes notes · Ressources » est partie : trois
          onglets sur quatre faisaient « retour », et ils ne correspondaient pas à ceux de la
          leçon. La saisie, elle, s'ouvre dans une FEUILLE — la liste reste derrière. */}
      {bandeau}

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
          {/* Pas de chevron : une note ne s'ouvre pas sur un autre écran, et un chevron
              promettait une navigation qui n'existait pas. Une note EN FILE porte l'horloge. */}
          {liste.map((n, i) => (
            <Revele key={n.id} i={i < 6 ? i : 0}>
              <LessonRow
                icon={<Icon name={'enFile' in n && n.enFile ? 'clock' : 'comment'} size={14} color={'enFile' in n && n.enFile ? t('mmOrangeT') : t('ink2')} />}
                title={n.texte}
                meta={n.date ?? undefined}
                last={i === liste.length - 1}
              />
            </Revele>
          ))}
        </Surface>
      )}

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Ce qu'elles deviennent</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrite hors
          réseau, une note part au retour.
        </Body>
      </Surface>

      <Feuille visible={redaction !== null} onFermer={() => setRedaction(null)} titre="Écrire une note">
        <Field
          label="Ta note"
          value={redaction ?? ''}
          onChangeText={setRedaction}
          placeholder="Ce que tu veux retenir de cette leçon."
          multiline
          autoFocus
          maxLength={4000}
          autoCapitalize="sentences"
          style={{ marginTop: 0 }}
        />
        <Button
          tone="forme"
          label={enCours ? 'Enregistrement…' : 'Enregistrer'}
          disabled={enCours || (redaction ?? '').trim() === ''}
          style={{ marginTop: 16, marginBottom: 8 }}
          onPress={() => { void enregistrer(redaction ?? ''); }}
        />
      </Feuille>

    </Screen>
  );
}
