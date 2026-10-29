import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, ChipRow, Feuille, Field, Icon, Num, PriceBlock, Pressoir, Revele,
  SansDonnees, Surface, Tag, TerritoryCard, haptique, isAndroid, useBandeau, useToken, Ligne,
  Liste,
} from '../../ds';
import { BilanPlie, ClubScreen } from './_layout';
import { ErreurAppel, posterAuClub, provenance, useAgenda, useClubFil } from '../../donnees';
import type { VueClubMessage } from '../../donnees';

/**
 * ══ 6 · LE FIL DU CLUB ══
 *
 * **LE BILAN D'ABONNEMENT EST EN TÊTE, ET IL EST PERMANENT.** C'est le premier des six
 * engagements du Club, et il répond à un problème précis : « un abonnement annuel ne supprime
 * pas le renoncement, il le CONCENTRE sur un instant. » Onze mois de silence, puis 19 900 F
 * d'un coup — le renoncement ne se prépare pas pendant l'année, il tombe d'un bloc à
 * l'échéance. Un bilan affiché le dernier jour arrive toujours trop tard.
 *
 * LA CARTE EST DE L'ENCRE OPAQUE, parce que la page est CLAIRE (voir `Bilan` dans `_layout`).
 *
 * ── LE FIL N'EST PAS UN FIL D'ACTUALITÉ ──────────────────────────────────────────────────
 * Pas de compteur de vues, pas de « tendance », pas d'ordre décidé par un moteur. Des gens qui
 * montrent ce qu'ils ont essayé, dans l'ordre où ils l'ont écrit — et une mission, quand il y
 * en a une, avec son budget ANNONCÉ PAR LA PERSONNE QUI PUBLIE. Ce dernier point est écrit
 * sur la carte : un budget qui aurait l'air de venir de nous fixerait une attente de revenu.
 */
const RUBRIQUES = ['Entraide', 'Questions', 'Outils', 'Victoires'] as const;

export default function Fil() {
  const t = useToken();
  const club = useClubFil();
  const agenda = useAgenda();
  const { bandeau, montrer } = useBandeau();
  const [publies, setPublies] = useState<Array<VueClubMessage & { enFile?: true }>>([]);
  const [ouverte, setOuverte] = useState(false);
  const [redaction, setRedaction] = useState('');
  const [rubrique, setRubrique] = useState<string>(RUBRIQUES[0]);
  const [enCours, setEnCours] = useState(false);
  const fil: Array<VueClubMessage & { enFile?: true }> = [...publies, ...(club.valeur?.fil ?? [])];

  /*
   * ── PUBLIER, DANS UNE FEUILLE ──────────────────────────────────────────────────────
   * La saisie s'ouvrait DANS le fil et poussait tout vers le bas. La feuille garde le fil
   * derrière elle — c'est lui, le repère — et la confirmation est le message lui-même, qui
   * entre en tête quand la feuille se referme. Hors réseau, il attend dans la file et part
   * au retour, avec la mention « en attente d'envoi ».
   */
  async function publier() {
    const texte = redaction.trim();
    if (texte === '' || enCours) return;
    setEnCours(true);
    try {
      const message = await posterAuClub(texte, rubrique);
      haptique.succes();
      setPublies((p) => [message, ...p]);
      setRedaction('');
      setOuverte(false);
    } catch (erreur: unknown) {
      montrer('stop', "Ton message n'est pas parti", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment : il est encore dans le champ.');
    } finally {
      setEnCours(false);
    }
  }
  const mission = club.valeur?.mission ?? null;
  /* La prochaine séance VIENT DE L'AGENDA. Elle était écrite en dur — « jeudi 10 septembre ·
     20:00 » — et restait affichée des semaines après la date. */
  const prochaine = agenda.valeur?.[0] ?? null;

  const ecrire = (
    <Button
      tone="transforme"
      size="sm"
      label="Écrire au Club"
      icon="pencil"
      onPress={() => setOuverte(true)}
    />
  );

  return (
    <ClubScreen titre="Le fil">
      <BilanPlie />
      {bandeau}

      {/* La seconde rangée « Fil · Discussions · Opportunités » est partie : elle doublait
          la bande des onglets juste au-dessus. */}
      <View style={{ flexDirection: 'row', justifyContent: isAndroid ? 'flex-start' : 'flex-end', marginTop: 14 }}>
        {ecrire}
      </View>

      {fil.length === 0 ? (
        <SansDonnees
          quoi="le fil du Club"
          degat="Un message inventé porte le nom de quelqu'un — un nom, un métier, un quartier qui appartiennent à une personne réelle. C'est le contenu du produit où fabriquer coûte le plus cher."
          etat={club}
          hauteur={4}
          style={{ marginTop: 14 }}
        />
      ) : fil.map((post, i) => (
        /* ⚠️ LA CLÉ EST L'IDENTIFIANT, jamais l'auteur : deux messages d'une même personne
           s'écrasaient au rendu. */
        <Revele key={post.id} i={i}>
          <Surface level="flat" style={{ marginTop: 14, padding: 18, opacity: post.enFile ? 0.75 : 1 }}>
            {/* L'en-tête ouvre la fiche du membre — le seul chemin vers le signalement et le
                blocage. On désigne le MESSAGE ; le serveur en résout l'auteur. */}
            <Pressoir
              accessibilityRole="button"
              accessibilityLabel={`Voir la fiche de ${post.auteur}`}
              desactive={post.enFile}
              onPress={post.enFile ? undefined : () => router.push({
                pathname: '/club/membre',
                params: { message: post.id, nom: post.auteur },
              })}
              style={{ flexDirection: 'row', gap: 11, alignItems: 'center', minHeight: 44 }}
            >
              <Avatar initials={post.initiales} size={38} decoratif />
              <View style={{ flex: 1 }}>
                <Body style={{ fontSize: 14, fontWeight: '600' }}>{post.auteur}</Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {post.enFile ? <Icon name="clock" size={12} color={t('textMuted')} /> : null}
                  <Body muted style={{ fontSize: 12 }}>{post.quand}</Body>
                </View>
              </View>
              <Tag>{post.categorie}</Tag>
            </Pressoir>

            {/* Passe 2 (maquette 26) : le texte ouvre la publication et ses commentaires. */}
            {post.enFile ? (
              <Body style={{ marginTop: 12, lineHeight: 21 }}>{post.texte}</Body>
            ) : (
              <Pressoir
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir la publication de ${post.auteur}`}
                onPress={() => router.push({ pathname: '/club/publication', params: { id: post.id } })}
              >
                <Body style={{ marginTop: 12, lineHeight: 21 }}>{post.texte}</Body>
              </Pressoir>
            )}

            {/* Trois compteurs, et aucun n'est un score. Ils ne se touchent pas : aucune
                réaction ne s'écrit depuis l'application, donc le cœur n'est plus coloré
                comme un bouton qu'on aurait pu presser. */}
            {post.enFile ? null : (
              <View style={{ flexDirection: 'row', gap: 18, marginTop: 14, alignItems: 'center' }}>
                {([
                  ['heart', post.aime, `${post.aime} personnes ont aimé`],
                  ['repeat', post.republie, `${post.republie} republications`],
                  ['comment', post.commente, `${post.commente} réponses`],
                ] as const).map(([glyphe, n, label]) => (
                  <View
                    key={glyphe}
                    accessible
                    accessibilityLabel={label}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <Icon name={glyphe} size={16} color={t('ink2')} />
                    <Num value={n} {...provenance(club)} style={{ fontSize: 12.5 }} />
                  </View>
                ))}
              </View>
            )}
          </Surface>
        </Revele>
      ))}

      {/* Une annonce, ou rien. Son budget peut manquer : « 0 F » se lisait comme une mission
          bénévole, alors qu'il n'était simplement pas annoncé. */}
      {mission === null ? null : (
      <View style={{ marginTop: 12 }}>
        <TerritoryCard
          first
          territory="transforme"
          meta={mission.meta}
          title={mission.titre}
          titleSize={21}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 12, marginTop: 14,
          }}>
            {mission.budget == null ? (
              <Num value={null} {...provenance(club)} fallback="budget non annoncé" style={{ fontSize: 13 }} />
            ) : (
              <PriceBlock amount={mission.budget} {...provenance(club)} size={21} note={mission.note} />
            )}
            <Button
              tone="transforme"
              size="sm"
              label="Voir les opportunités"
              onPress={() => router.push('/club/opportunites')}
            />
          </View>
        </TerritoryCard>
      </View>
      )}

      {prochaine ? (
        <Liste style={{ marginTop: 14 }}>
          <Ligne
            icone="calendar"
            titre="La prochaine session"
            sous={[prochaine.jour, prochaine.horaire].filter(Boolean).join(' · ')}
            onPress={() => router.push('/club/agenda')}
          />
        </Liste>
      ) : null}

      <Feuille visible={ouverte} onFermer={() => setOuverte(false)} titre="Écrire au Club">
        <ChipRow options={RUBRIQUES} value={rubrique} onChange={setRubrique} />
        <Field
          label="Ton message"
          value={redaction}
          onChangeText={setRedaction}
          placeholder="Ce que tu as essayé, et ce que ça a donné."
          multiline
          autoFocus
          maxLength={2000}
          autoCapitalize="sentences"
          hint="Signé de ton nom d'affichage, celui de ton profil. Hors réseau, il part au retour."
        />
        <Button
          tone="transforme"
          label={enCours ? 'Publication…' : 'Publier'}
          disabled={enCours || redaction.trim() === ''}
          style={{ marginTop: 16, marginBottom: 8 }}
          onPress={() => { void publier(); }}
        />
      </Feuille>
    </ClubScreen>
  );
}
