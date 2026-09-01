import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Avatar, Body, Display, EmptyState, Eyebrow, Icon, Surface, Tag, useToken } from '../../ds';
import { ClubScreen, texte } from './_layout';

/**
 * ── 5 · MEMBRE ────────────────────────────────────────────────────────────────────────
 *
 * L'ÉCRAN LE PLUS DANGEREUX DU LOT POUR UNE DONNÉE INVENTÉE. Une liste de cours simulée
 * ment sur un catalogue ; un PROFIL simulé attribue un nom, un métier et un quartier à une
 * personne — et le kit ajoute un niveau, des publications et un nombre de « j'aime ». Rien
 * de tout ça n'est affiché sans venir de la route : ce profil montre ce que l'écran
 * précédent lui a passé, ou il dit qu'il n'a personne.
 *
 * LE SIGNALEMENT, LUI, EST TOUJOURS ÉCRIT — c'est le cinquième engagement du Club, et c'est
 * une règle, pas une donnée. Elle vaut qu'un profil soit ouvert ou non : le signalement part
 * à l'administration SEULE. La personne signalée ne le voit pas et ne peut pas l'annuler.
 * Le dire avant plutôt qu'après est ce qui fait qu'on ose signaler.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
/** Deux initiales, tirées du nom reçu. Jamais une photographie : aucune n'existe au dépôt. */
function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ClubMembre() {
  const t = useToken();
  const p = useLocalSearchParams<{
    nom?: string; initiales?: string; metier?: string; ville?: string; depuis?: string;
  }>();

  const nom = texte(p.nom);
  const metier = texte(p.metier);
  const ville = texte(p.ville);
  const depuis = texte(p.depuis);
  const ini = texte(p.initiales) ?? (nom === null ? null : initiales(nom));
  const lieu = [metier, ville].filter((x): x is string => x !== null).join(' · ');

  return (
    <ClubScreen titre="Membre">
      {nom === null ? (
        <Surface level="flat" style={{ paddingVertical: 6 }}>
          <EmptyState
            glyph={<Icon name="user" size={24} color={t('mmVioletT')} />}
            title="Aucun membre ouvert"
            body="On arrive sur cette fiche depuis le fil, une discussion ou le classement — et c'est de là qu'elle reçoit qui elle décrit. Je n'affiche pas de profil d'exemple en attendant : un membre inventé porte un nom, un métier et un quartier qui appartiennent à quelqu'un."
          />
        </Surface>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Avatar initials={ini ?? ''} size={64} />
            <View style={{ flex: 1 }}>
              <Display size="xs">{nom}</Display>
              {lieu === '' ? null : (
                <Body muted style={{ marginTop: 4, fontSize: 13 }}>{lieu}</Body>
              )}
            </View>
          </View>

          {depuis === null ? null : (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              <Tag>{`Membre depuis ${depuis}`}</Tag>
            </View>
          )}

          <Surface level="flat" style={{ marginTop: 16, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="chat" size={18} color={t('ink2')} />
              <Body style={{ flex: 1, fontWeight: '700' }}>Le message privé n'est pas branché</Body>
            </View>
            <Body muted style={{ marginTop: 8, fontSize: 13 }}>
              Le bouton « Lui écrire » n'est pas affiché tant qu'il n'ouvrirait rien. Ses
              publications et son niveau non plus : ce sont ses données, et je ne les
              reconstitue pas de mémoire.
            </Body>
          </Surface>
        </>
      )}

      {/* ENGAGEMENT 5 — une règle, donc écrite qu'il y ait un profil ouvert ou non. */}
      <Surface level="flat" style={{ marginTop: 16, padding: 18, borderColor: t('stop') }}>
        <View style={{ flexDirection: 'row', gap: 11 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 11, flexShrink: 0,
            alignItems: 'center', justifyContent: 'center', backgroundColor: t('stateStop'),
          }}>
            <Icon name="alert" size={16} color={t('stop')} />
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700', color: t('stop') }}>
              {nom === null ? 'Signaler un membre' : 'Signaler ce membre'}
            </Body>
            <Body muted style={{ marginTop: 4, fontSize: 12.5 }}>
              Le signalement part à l'administration seule. La personne signalée ne le voit
              pas et ne peut pas l'annuler.
            </Body>
            <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
              Le geste lui-même n'est pas encore branché ici — et je préfère te dire la règle
              maintenant qu'afficher un bouton qui n'enverrait rien.
            </Body>
          </View>
        </View>
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Ce que cette fiche n'affichera jamais</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Ni photographie générée à la place d'une vraie, ni compteur de membres du Club.
          Les initiales sont l'état livré, pas un fond d'attente.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
