import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Avatar, Body, Button, Display, Eyebrow, Icon, LessonRow, Num, Surface, Tag, useToken, veil,
} from '../../ds';
import { ClubScreen } from './_layout';
import { MEMBRE, RELEVE, SOURCE } from '../../contenu/reference';

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
  const p = useLocalSearchParams<{ nom?: string; metier?: string; ville?: string }>();

  const nom = p.nom ?? MEMBRE.nom;
  const metier = p.metier ?? MEMBRE.metier;
  const ville = p.ville ?? MEMBRE.ville;
  const initiales = nom.trim().split(' ').map((m) => m.charAt(0)).join('').slice(0, 2).toUpperCase();

  function signaler() {
    Alert.alert(
      'Signaler ce profil',
      "Le signalement part tout de suite, sans que tu aies à expliquer pourquoi. Je te demanderai le motif ensuite, si tu veux le donner — et la personne ne saura pas que ça vient de toi.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Signaler', style: 'destructive' },
      ],
    );
  }

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
          <Tag tone="ok">{MEMBRE.depuis}</Tag>
          {MEMBRE.formations.map((f) => <Tag key={f}>{f}</Tag>)}
        </View>

        <Body style={{ marginTop: 14, lineHeight: 22 }}>{MEMBRE.presentation}</Body>
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Ce que la fiche porte</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="comment" size={14} color={t('ink2')} />}
          title="Contributions au fil"
          trailing={<Num value={MEMBRE.contributions} source={SOURCE} asOf={RELEVE} style={{ fontSize: 13 }} />}
        />
        <LessonRow
          icon={<Icon name="book" size={14} color={t('ink2')} />}
          title="Formations suivies"
          trailing={<Num value={MEMBRE.formations.length} source={SOURCE} asOf={RELEVE} style={{ fontSize: 13 }} />}
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
