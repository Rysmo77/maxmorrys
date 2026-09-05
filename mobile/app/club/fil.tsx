import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, ChipRow, Field, Icon, LessonRow, Num, PriceBlock, SansDonnees, Surface, Tag, TerritoryCard, useToken,
} from '../../ds';
import { Bilan, ClubScreen } from './_layout';
import { ErreurAppel, posterAuClub, provenance, useClubFil } from '../../donnees';
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
export default function Fil() {
  const t = useToken();
  const club = useClubFil();
  const [publies, setPublies] = useState<VueClubMessage[]>([]);
  const [redaction, setRedaction] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const fil = [...publies, ...(club.valeur?.fil ?? [])];

  async function publier(texte: string) {
    if (texte.trim() === '' || enCours) return;
    setEnCours(true);
    try {
      const message = await posterAuClub(texte);
      /* En TÊTE, et sans relire : le fil est trié du plus récent au plus ancien, et
         redemander le serveur pour voir ce qu'on vient d'écrire coûterait un aller-retour
         pour afficher ce qu'on connaît déjà. */
      setPublies((p: VueClubMessage[]) => [message, ...p]);
      setRedaction(null);
    } catch (erreur: unknown) {
      Alert.alert(
        "Ton message n'est pas parti",
        erreur instanceof ErreurAppel
          ? `${erreur.motif} Recopie-le avant de quitter l'écran.`
          : "Recopie-le avant de quitter l'écran, il n'est nulle part.",
      );
    } finally {
      setEnCours(false);
    }
  }
  const mission = club.valeur?.mission ?? null;

  return (
    <ClubScreen titre="Le fil">
      <Bilan />

      {/* ⚠️ « Membres » A ÉTÉ RETIRÉ. Il poussait vers `/club/membre` SANS DÉSIGNER PERSONNE :
          la fiche d'un membre est un détail, pas une destination. Elle s'ouvre maintenant en
          touchant l'auteur d'un message. */}
      <ChipRow
        options={['Fil', 'Discussions', 'Opportunités']}
        value="Fil"
        onChange={(v) => {
          if (v === 'Discussions') router.push('/club/discussions');
          if (v === 'Opportunités') router.push('/club/opportunites');
        }}
        style={{ marginTop: 18 }}
      />

      {/* ── ÉCRIRE, DANS L'ÉCRAN ──────────────────────────────────────────────────────
          Le fil n'avait aucun moyen d'y contribuer : on pouvait le lire, pas y répondre.
          La saisie s'ouvre ici plutôt que sur un écran à part — et c'est aussi la seule
          forme qui marche sur les deux plateformes. */}
      {redaction === null ? (
        <Button
          tone="quiet"
          size="sm"
          label="Écrire au Club"
          icon="comment"
          style={{ marginTop: 14 }}
          onPress={() => setRedaction('')}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 14, padding: 16 }}>
          <Field
            label="Ton message"
            value={redaction}
            onChangeText={setRedaction}
            placeholder="Ce que tu as essayé, et ce que ça a donné."
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
              tone="transforme"
              size="sm"
              label={enCours ? 'Publication…' : 'Publier'}
              disabled={enCours || redaction.trim() === ''}
              style={{ flex: 1 }}
              onPress={() => { void publier(redaction); }}
            />
          </View>
          <Body muted style={{ fontSize: 11.5, lineHeight: 17, marginTop: 10, color: t('textFaint') }}>
            Ton message part signé de ton nom d'affichage — celui de ton profil, pas un
            pseudonyme choisi ici.
          </Body>
        </Surface>
      )}

      {fil.length === 0 ? (
        <SansDonnees
          quoi="le fil du Club"
          degat="Un message inventé porte le nom de quelqu'un — un nom, un métier, un quartier qui appartiennent à une personne réelle. C'est le contenu du produit où fabriquer coûte le plus cher."
          etat={club}
          hauteur={4}
          style={{ marginTop: 14 }}
        />
      ) : fil.map((post) => (
        /* ⚠️ LA CLÉ ÉTAIT `post.auteur`. Deux messages de la même personne portaient donc la
           même clé : React en écrasait un au rendu, et le fil perdait des messages sans que
           rien ne le signale. Le défaut devient franc dès qu'un filtre change la composition
           de la liste — c'est-à-dire depuis le blocage. */
        <Surface key={post.id} level="flat" style={{ marginTop: 14, padding: 18 }}>
          {/* L'en-tête ouvre la fiche du membre. C'est le SEUL chemin vers elle, et donc vers
              le signalement et le blocage : on désigne le MESSAGE, le serveur en résout
              l'auteur, et aucun identifiant de personne ne circule côté client. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Voir la fiche de ${post.auteur}`}
            onPress={() => router.push({
              pathname: '/club/membre',
              params: { message: post.id, nom: post.auteur },
            })}
            style={({ pressed }: { pressed: boolean }) => ({
              flexDirection: 'row', gap: 11, alignItems: 'center',
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Avatar initials={post.initiales} size={38} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 14, fontWeight: '600' }}>{post.auteur}</Body>
              <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('textFaint') }}>
                {post.categorie} · {post.quand}
              </Body>
            </View>
            <Tag>{post.categorie}</Tag>
          </Pressable>

          <Body style={{ marginTop: 12, lineHeight: 21 }}>{post.texte}</Body>

          {/* Trois compteurs, et aucun n'est un score : ils disent ce que d'autres ont FAIT
              de ce message, pas ce qu'il « vaut ». */}
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
                <Icon name={glyphe} size={16} color={glyphe === 'heart' ? t('mmVioletT') : t('ink2')} />
                <Num value={n} {...provenance(club)} style={{ fontSize: 12.5 }} />
              </View>
            ))}
          </View>
        </Surface>
      ))}

      {/* Une annonce, ou rien : un budget inventé fixe une attente de revenu chez quelqu'un
          qui organise son temps dessus. */}
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
            <PriceBlock
              amount={mission.budget ?? 0}
              {...provenance(club)}
              size={21}
              note={mission.note}
            />
            <Button
              tone="transforme"
              size="sm"
              label="Postuler"
              onPress={() => router.push('/club/opportunites')}
            />
          </View>
        </TerritoryCard>
      </View>
      )}

      <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="calendar" size={14} color={t('ink2')} />}
          title="La prochaine session"
          meta="jeudi 10 septembre · 20:00"
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => router.push('/club/agenda')}
          last
        />
      </Surface>
    </ClubScreen>
  );
}
