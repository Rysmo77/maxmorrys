import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Avatar, Body, Icon, Num, Pressoir, Rubrique, SansDonnees, Surface, Tag, useToken, nonBranche
} from '../../ds';
import { ClubScreen, texte } from './_layout';
import { provenance, useClubFil } from '../../donnees';
import { Verite } from '../../ecrans/Verite';

/** Aucune source serveur pour ces blocs : la phase est dite, pas supposée. */
const NON_BRANCHE = nonBranche();

/**
 * ══ 26 · PUBLICATION ══ (maquette Rysmo-iOS-26).
 *
 * La publication vient du FIL RÉEL (`appClubFil`), retrouvée par son identifiant : son auteur,
 * sa catégorie, son texte entier et ses compteurs, datés. Les COMMENTAIRES n'ont pas de source
 * côté application — chacun porte le nom de quelqu'un — : leur emplacement dit qu'ils ne sont
 * pas servis. Le champ « Ton commentaire… » n'est pas posé : un message qui ne part nulle part
 * est un message perdu.
 */
export default function ClubPublication() {
  const t = useToken();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const club = useClubFil();
  const post = club.valeur?.fil.find((p) => p.id === texte(id)) ?? null;

  return (
    <ClubScreen titre="Publication">
      {post === null ? (
        <SansDonnees
          quoi="cette publication"
          origine="du fil du Club"
          etat={club.valeur ? { phase: 'vide', valeur: null, ...provenance(club) } : club}
          style={{ marginTop: 12 }}
        />
      ) : (
        <>
          <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
            <Pressoir
              accessibilityRole="button"
              accessibilityLabel={`Voir la fiche de ${post.auteur}`}
              onPress={() => router.push({ pathname: '/club/membre', params: { message: post.id, nom: post.auteur } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar initials={post.initiales} size={40} decoratif />
              <View style={{ flex: 1 }}>
                <Body style={{ fontSize: 14, fontWeight: '600' }}>{post.auteur}</Body>
                <Body muted style={{ fontSize: 12 }}>{[post.categorie, post.quand].filter(Boolean).join(' · ')}</Body>
              </View>
              <Tag>{post.categorie}</Tag>
            </Pressoir>
            <Body style={{ marginTop: 12, lineHeight: 21 }}>{post.texte}</Body>
            <View style={{ flexDirection: 'row', gap: 18, marginTop: 14 }}>
              {([
                ['heart', post.aime, `${post.aime} personnes ont aimé`],
                ['comment', post.commente, `${post.commente} réponses`],
              ] as const).map(([glyphe, n, label]) => (
                <View key={glyphe} accessible accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name={glyphe} size={16} color={t('ink2')} />
                  <Num value={n} {...provenance(club)} style={{ fontSize: 12.5 }} />
                </View>
              ))}
            </View>
          </Surface>

          <Rubrique>{`Commentaires · ${post.commente}`}</Rubrique>
          <SansDonnees
            etat={NON_BRANCHE}
            quoi="les commentaires"
            origine="du fil du Club"
          />
          <Verite titre="Commenter">
            Les commentaires s'écriront ici quand le serveur les servira à l'application. Les
            réactions et le signalement passent par la fiche du membre.
          </Verite>
        </>
      )}
    </ClubScreen>
  );
}
