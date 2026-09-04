import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Avatar, Body, Button, Display, Eyebrow, Icon, LessonRow, Num, SansDonnees, Surface, Tag, useToken, veil,
} from '../../ds';
import { ClubScreen } from './_layout';
import { ErreurAppel, provenance, signalerLeMembre, useMembre } from '../../donnees';

/**
 * ── CLUB · LA FICHE D'UN MEMBRE ───────────────────────────────────────────────────────
 *
 * **CE QUI N'EST PAS SUR CETTE FICHE EST AUSSI IMPORTANT QUE CE QUI Y EST.** Pas de numéro de
 * téléphone, pas d'adresse, pas de dernier passage. Un club professionnel où l'on peut
 * récupérer le numéro de quelqu'un en deux touches devient un annuaire de démarchage, et ce
 * sont les femmes qui partent en premier.
 *
 * ── LE SIGNALEMENT EST EN BAS, VISIBLE, ET IL NE DEMANDE PAS DE MOTIF ────────────────────
 * Exiger d'écrire pourquoi avant de pouvoir signaler, c'est demander à quelqu'un de mettre des
 * mots sur ce qui vient de le mettre mal à l'aise, dans l'écran où il est mal à l'aise. Le
 * motif se demande APRÈS, si la personne veut le donner.
 *
 * LES CONTRIBUTIONS SE COMPTENT, PAS LA « RÉPUTATION ». Un nombre de messages est vérifiable ;
 * un score ne l'est pas, et il classe des gens.
 */
export default function ClubMembre() {
  const t = useToken();
  const p = useLocalSearchParams<{ id?: string; nom?: string; metier?: string; ville?: string }>();
  const fiche = useMembre(p.id);

  /* Les paramètres priment sur la fiche : quand une liste transmet déjà le nom, l'écran
     l'affiche avant même que la lecture aboutisse — c'est ce qui évite un titre vide
     pendant une seconde sur un écran ouvert depuis le fil. */
  const nom = p.nom ?? fiche.valeur?.nom ?? null;
  const metier = p.metier ?? fiche.valeur?.metier ?? null;
  const ville = p.ville ?? fiche.valeur?.ville ?? null;
  const initiales = nom === null ? null
    : nom.trim().split(' ').map((m: string) => m.charAt(0)).join('').slice(0, 2).toUpperCase();

  /*
   * ⚠️ CETTE ALERTE PROMETTAIT CE QU'ELLE NE FAISAIT PAS. Elle affirmait « le signalement
   * part tout de suite » et son bouton destructif n'avait aucun gestionnaire : il se
   * fermait sans rien envoyer. Sur un signalement, celui qui l'a touché s'en va en pensant
   * que c'est traité — et ne le refait pas.
   */
  async function envoyerLeSignalement() {
    if (!p.id) {
      Alert.alert('Membre non identifié', "Ouvre la fiche depuis le fil ou l'annuaire.");
      return;
    }
    try {
      await signalerLeMembre(p.id);
      Alert.alert('C\'est envoyé', 'Le support le regarde. La personne ne saura pas que ça vient de toi.');
    } catch (erreur: unknown) {
      Alert.alert(
        "Le signalement n'est pas parti",
        erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.',
      );
    }
  }

  function signaler() {
    Alert.alert(
      'Signaler ce profil',
      "Le signalement part tout de suite, sans que tu aies à expliquer pourquoi. Je te demanderai le motif ensuite, si tu veux le donner — et la personne ne saura pas que ça vient de toi.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Signaler', style: 'destructive', onPress: () => { void envoyerLeSignalement(); } },
      ],
    );
  }

  if (nom === null || initiales === null || fiche.valeur === null) {
    return (
      <ClubScreen titre="Membre">
        <Display size={24} lines={['Cette fiche', "n'est pas chargée."]} />
        <SansDonnees
          quoi="cette fiche"
          origine="du compte de la personne"
          degat="Une fiche inventée attribue un métier et un quartier à quelqu'un. Et ce qui n'y figure jamais — ni numéro, ni adresse — vaut aussi pour une fiche fabriquée."
          style={{ marginTop: 20 }}
        />
      </ClubScreen>
    );
  }
  const membre = fiche.valeur;

  return (
    <ClubScreen titre="Membre">
      <Surface level="flat" style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar initials={initiales} size={58} />
          <View style={{ flex: 1 }}>
            <Display size={20}>{nom}</Display>
            <Body muted style={{ fontSize: 13, marginTop: 4 }}>{metier}</Body>
            <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('textFaint'), marginTop: 2 }}>
              {ville}
            </Body>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          <Tag tone="ok">{membre.depuis}</Tag>
          {membre.formations.map((f) => <Tag key={f}>{f}</Tag>)}
        </View>

        <Body style={{ marginTop: 14, lineHeight: 22 }}>{membre.presentation}</Body>
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Ce que la fiche porte</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="comment" size={14} color={t('ink2')} />}
          title="Contributions au fil"
          trailing={<Num value={membre.contributions} {...provenance(fiche)} style={{ fontSize: 13 }} />}
        />
        <LessonRow
          icon={<Icon name="book" size={14} color={t('ink2')} />}
          title="Formations suivies"
          trailing={<Num value={membre.formations.length} {...provenance(fiche)} style={{ fontSize: 13 }} />}
          last
        />
      </Surface>

      <Button
        tone="transforme"
        label="Écrire dans le fil"
        style={{ marginTop: 16 }}
        onPress={() => router.push('/club/fil')}
      />

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Ce qui n'est pas ici, et pourquoi</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Ni numéro, ni adresse, ni date de dernière visite. Un club où l'on récupère le numéro
          de quelqu'un en deux touches devient un annuaire de démarchage — et ce sont les femmes
          qui partent en premier. Les échanges passent par le fil, où tout le monde voit.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 17, borderColor: veil(t('stop'), 0.22) }}>
        <Eyebrow>Un problème avec ce profil</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Le signalement part sans motif obligatoire, et la personne ne saura pas qu'il vient de
          toi. Je te demande le motif après, si tu veux le donner.
        </Body>
        <Button tone="quiet" size="sm" label="Signaler ce profil" style={{ marginTop: 12 }} onPress={signaler} />
      </Surface>
    </ClubScreen>
  );
}
