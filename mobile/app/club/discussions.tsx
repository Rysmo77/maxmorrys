import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, ChipRow, EmptyState, Eyebrow, Feuille, Field, Fondu, Icon, Num, Pressoir, Revele, SansDonnees,
  Surface, Tag, useBandeau, useToken,
} from '../../ds';
import { ClubScreen } from './_layout';
import { ErreurAppel, posterAuClub, provenance, useDiscussions } from '../../donnees';

/**
 * ── CLUB · DISCUSSIONS ────────────────────────────────────────────────────────────────
 *
 * **LA QUESTION BÊTE SE POSE ICI.** C'est la promesse de l'onglet, et elle décide de son
 * dessin : pas de score de réputation, pas de « meilleure réponse » élue par des votes, pas
 * de badge. Trois choses seulement — qui demande, depuis quand, et si quelqu'un a répondu.
 *
 * LE DÉCOMPTE DÉRIVE DES LISTES STOCKÉES, ce n'est pas un compteur libre : personne ne saisit
 * « 14 réponses » à la main, c'est la longueur d'une liste. Un compteur qu'on peut écrire est
 * un compteur qui finit par diverger de ce qu'on peut ouvrir.
 *
 * « RÉSOLU » EST POSÉ PAR CELUI QUI A DEMANDÉ, jamais par un modérateur : c'est la seule
 * personne qui sache si la réponse a marché.
 */
const CATEGORIES = ['Toutes', 'Entraide', 'Outils', 'Clients'] as const;

export default function ClubDiscussions() {
  const t = useToken();
  const [cat, setCat] = useState<string>(CATEGORIES[0]);
  const { bandeau, montrer } = useBandeau();

  const discussions = useDiscussions();
  const sujets = discussions.valeur ?? [];
  const visibles = cat === 'Toutes' ? sujets : sujets.filter((d) => d.categorie === cat);
  /* ⚠️ LE COMPTE NE S'AFFICHE QUE SERVI. `valeur ?? []` valait « 0 discussion » pendant la
     lecture comme en panne : un zéro affirmé avant d'avoir compté. */
  const servi = discussions.phase === 'servie' || discussions.phase === 'replique' || discussions.phase === 'vide';

  /*
   * ── POSER UNE QUESTION ─────────────────────────────────────────────────────────────
   * L'onglet ne permettait que de lire. La question part dans le FIL, rubrique
   * « Questions » : c'est là que les membres répondent. Une discussion créée ici, sans
   * personne pour y répondre dans l'application, serait une impasse.
   */
  const [ouverte, setOuverte] = useState(false);
  const [question, setQuestion] = useState('');
  const [envoi, setEnvoi] = useState(false);
  async function poser() {
    const texte = question.trim();
    if (texte === '' || envoi) return;
    setEnvoi(true);
    try {
      await posterAuClub(texte, 'Questions');
      setOuverte(false);
      setQuestion('');
      montrer('ok', 'Ta question est dans le fil', 'Les membres y répondent sous ton message.');
    } catch (erreur: unknown) {
      montrer('stop', "Ta question n'est pas partie", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <ClubScreen titre="Discussions">
      <ChipRow options={CATEGORIES} value={cat} onChange={setCat} />
      {bandeau}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
        <Eyebrow>{cat === 'Toutes' ? 'Toutes catégories' : cat}</Eyebrow>
        {servi ? (
          <Num
            value={visibles.length}
            {...provenance(discussions)}
            unit={visibles.length > 1 ? 'discussions' : 'discussion'}
            style={{ fontSize: 12 }}
          />
        ) : null}
      </View>

      <Button tone="transforme" size="sm" label="Poser une question" icon="plus" style={{ marginTop: 12 }} onPress={() => setOuverte(true)} />

      <Fondu cle={cat}>
      {!servi ? (
        <SansDonnees quoi="les discussions" etat={discussions} hauteur={4} style={{ marginTop: 12 }} />
      ) : visibles.length === 0 ? (
        <Surface level="flat" style={{ marginTop: 12, paddingVertical: 6 }}>
          <EmptyState
            glyph={<Icon name="chat" size={24} color={t('mmVioletT')} />}
            title={cat === 'Toutes' ? 'Aucune discussion pour l’instant' : `Rien dans « ${cat} »`}
            body="Pose la première question : elle part dans le fil, où les membres répondent."
          />
        </Surface>
      ) : visibles.map((d, i) => (
        <Revele key={d.id} i={i}>
          <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
            {/* L'AUTEUR SE TOUCHE : sa fiche porte « Signaler » et « Bloquer », que l'exigence
                1.2 demande là où le contenu se lit. Le serveur résout l'auteur depuis la
                discussion : l'uid ne circule pas. */}
            <Pressoir
              accessibilityRole="button"
              accessibilityLabel={`Voir la fiche de ${d.auteur}`}
              onPress={() => router.push({ pathname: '/club/membre', params: { discussion: d.id, nom: d.auteur } })}
              style={{ flexDirection: 'row', gap: 11, alignItems: 'center', minHeight: 44 }}
            >
              <Avatar initials={d.initiales} size={34} decoratif />
              <View style={{ flex: 1 }}>
                <Body style={{ fontSize: 13.5, fontWeight: '600' }}>{d.auteur}</Body>
                <Body muted style={{ fontSize: 12 }}>
                  {[d.categorie, d.quand].filter(Boolean).join(' · ')}
                </Body>
              </View>
              {d.resolu ? <Tag tone="ok">Résolu</Tag> : null}
            </Pressoir>

            <Body style={{ marginTop: 11, fontSize: 14.5, lineHeight: 21, fontWeight: '600' }}>{d.titre}</Body>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}>
              <Icon name="comment" size={15} color={t('ink2')} />
              <Num
                value={d.reponses}
                {...provenance(discussions)}
                unit={d.reponses > 1 ? 'réponses' : 'réponse'}
                style={{ fontSize: 12.5 }}
              />
            </View>
          </Surface>
        </Revele>
      ))}
      </Fondu>

      <Surface level="flat" style={{ marginTop: 16, padding: 17 }}>
        <Eyebrow>Qui répond</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          D'autres membres, et moi. Pas un modérateur, pas un robot. « Résolu » est posé par la
          personne qui a demandé : c'est la seule qui sache si ça a marché.
        </Body>
      </Surface>

      <Feuille visible={ouverte} onFermer={() => setOuverte(false)} titre="Poser une question">
        <Field
          label="Ta question"
          value={question}
          onChangeText={setQuestion}
          multiline
          autoFocus
          maxLength={2000}
          autoCapitalize="sentences"
          hint="Elle part dans le fil du Club, rubrique Questions. Tout le Club la voit."
          style={{ marginTop: 0 }}
        />
        <Button
          tone="transforme"
          label={envoi ? 'Envoi…' : 'Publier ma question'}
          disabled={question.trim() === '' || envoi}
          style={{ marginTop: 16, marginBottom: 8 }}
          onPress={() => { void poser(); }}
        />
      </Feuille>
    </ClubScreen>
  );
}
