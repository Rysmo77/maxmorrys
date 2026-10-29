import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Avatar, Body, Button, ChipRow, Display, Eyebrow, Feuille, Field, Num, SansDonnees,
  Surface, Tag, haptique, useBandeau, useToken, veil, Ligne, Liste, Rubrique,
} from '../../ds';
import { ClubScreen } from './_layout';
import { ErreurAppel, bloquerLeMembre, provenance, signalerLeMembre, useMembre } from '../../donnees';

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
  const p = useLocalSearchParams<{
    id?: string; message?: string; discussion?: string; opportunite?: string;
    nom?: string; metier?: string; ville?: string;
  }>();
  /* ⚠️ `message` EST CE QUI RENDAIT CET ÉCRAN ATTEIGNABLE. Aucun appelant ne passait d'`id`,
     donc la vue jetait `invalid-argument`, l'écran sortait par sa branche courte, et le
     bouton « Signaler ce profil » n'était JAMAIS rendu — la guideline 1.2 comptait zéro. On
     désigne désormais un message du fil, et le serveur en résout l'auteur. */
  const fiche = useMembre(p.id, p.message, { discussion: p.discussion, opportunite: p.opportunite });
  const { bandeau, montrer } = useBandeau();
  /* Le motif se demande APRÈS l'envoi, dans une feuille : l'écran le promettait, et rien ne
     le demandait jamais. Il reste facultatif. */
  const [motifOuvert, setMotifOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [raison, setRaison] = useState('');

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
    const vise = fiche.valeur?.id ?? p.id;
    if (!vise) {
      montrer('stop', 'Membre non identifié', "Ouvre la fiche depuis le fil ou l'annuaire.");
      return;
    }
    try {
      await signalerLeMembre(vise);
      haptique.succes();
      setMotifOuvert(true);
    } catch (erreur: unknown) {
      montrer('stop', "Le signalement n'est pas parti", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    }
  }

  /* Le serveur écrit un document déterministe : renvoyer avec le motif COMPLÈTE le même
     signalement, il n'en crée pas un second. */
  async function envoyerLeMotif() {
    const vise = fiche.valeur?.id ?? p.id;
    const texte = [raison, motif.trim()].filter(Boolean).join(' — ');
    setMotifOuvert(false);
    if (!vise || texte === '') {
      montrer('ok', 'Signalement envoyé', 'Le support le regarde. La personne ne saura pas que ça vient de toi.');
      return;
    }
    try {
      await signalerLeMembre(vise, texte);
      montrer('ok', 'Signalement envoyé, avec ton motif', 'Le support le regarde. La personne ne saura pas que ça vient de toi.');
    } catch {
      montrer('ok', 'Signalement envoyé', "Ton motif n'est pas parti, mais le signalement, lui, est bien arrivé.");
    }
  }

  function signaler() {
    haptique.attention();
    Alert.alert(
      'Signaler ce profil',
      "Le signalement part tout de suite. Tu pourras ensuite dire pourquoi, si tu veux — et la personne ne saura pas que ça vient de toi.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Signaler', style: 'destructive', onPress: () => { void envoyerLeSignalement(); } },
      ],
    );
  }

  function basculerLeBlocage() {
    const vise = fiche.valeur?.id;
    const dejaBloque = fiche.valeur?.bloque === true;
    if (!vise) {
      montrer('stop', 'Membre non identifié', "Ouvre la fiche depuis le fil ou l'annuaire.");
      return;
    }
    haptique.attention();
    Alert.alert(
      dejaBloque ? `Débloquer ${nom ?? 'ce membre'} ?` : `Bloquer ${nom ?? 'ce membre'} ?`,
      dejaBloque
        ? 'Ses publications réapparaîtront dans le fil, les discussions et les opportunités.'
        : 'Ses publications disparaîtront du fil, des discussions et des opportunités. Cette personne n’en sera pas prévenue, et tu pourras défaire depuis « Comptes bloqués ».',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: dejaBloque ? 'Débloquer' : 'Bloquer',
          style: dejaBloque ? 'default' : 'destructive',
          onPress: () => {
            /* RETOUR AU FIL, RELU. `replace` empilait un second fil par-dessus le premier, qui
               montrait encore la personne bloquée au retour. L'écriture périme les vues ; le
               fil déjà monté se relit, et la pile se referme dessus. */
            void bloquerLeMembre({ type: 'membre', id: vise }, !dejaBloque)
              .then(() => {
                haptique.succes();
                if (router.canDismiss()) router.dismissTo('/club/fil');
                else router.replace('/club/fil');
              })
              .catch(() => montrer(
                'stop',
                dejaBloque ? 'Le déblocage n’a pas abouti' : 'Le blocage n’a pas abouti',
                'Rien n’a changé. Réessaie dans un moment.',
              ));
          },
        },
      ],
    );
  }

  if (nom === null || initiales === null || fiche.valeur === null) {
    const enLecture = fiche.phase === 'charge' || fiche.phase === 'restauration';
    return (
      <ClubScreen titre="Membre">
        {enLecture ? null : <Display size={24} lines={['Cette fiche', "n'est pas chargée."]} />}
        <SansDonnees
          quoi="cette fiche"
          origine="du compte de la personne"
          etat={fiche}
          style={{ marginTop: enLecture ? 4 : 20 }}
        />
      </ClubScreen>
    );
  }
  const membre = fiche.valeur;

  return (
    <ClubScreen titre="Membre">
      {bandeau}
      <Surface level="flat" style={{ padding: 20, marginTop: bandeau ? 12 : 0 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar initials={initiales} size={58} decoratif />
          <View style={{ flex: 1 }}>
            <Display size={20}>{nom}</Display>
            <Body muted style={{ fontSize: 13, marginTop: 4 }}>{metier}</Body>
            {ville ? <Body muted style={{ fontSize: 12.5, marginTop: 2 }}>{ville}</Body> : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          {membre.depuis ? <Tag tone="ok">{membre.depuis}</Tag> : null}
          {membre.formations.map((f) => <Tag key={f}>{f}</Tag>)}
        </View>

        <Body style={{ marginTop: 14, lineHeight: 22 }}>{membre.presentation}</Body>
      </Surface>

      <Rubrique>Ce que la fiche porte</Rubrique>
      <Liste>
        <Ligne
          icone="comment"
          titre="Contributions au fil"
          droite={<Num value={membre.contributions} {...provenance(fiche)} style={{ fontSize: 13 }} />}
        />
        <Ligne
          icone="book"
          titre="Formations suivies"
          droite={<Num value={membre.formations.length} {...provenance(fiche)} style={{ fontSize: 13 }} />}
        />
      </Liste>

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
          toi. Le motif se donne après, si tu veux.
        </Body>
        <Button tone="danger" size="sm" label="Signaler ce profil" icon="flag" style={{ marginTop: 12 }} onPress={signaler} />

        {/* ── LE BLOCAGE — exigence App Store 1.2 ────────────────────────────────────────
            Le signalement s'adresse à nous ; le blocage n'engage que toi. Les deux sont
            demandés par la guideline, et confondre l'un avec l'autre laisse quelqu'un
            attendre une modération alors qu'il voulait juste ne plus lire quelqu'un. */}
        <Body muted style={{ marginTop: 14, fontSize: 12.5, lineHeight: 19 }}>
          Le blocage, lui, ne nous concerne pas : il retire les publications de cette personne
          du fil, des discussions et des opportunités — pour toi uniquement. Cette personne n’en
          est pas prévenue.
        </Body>
        <Button
          size="sm"
          tone={fiche.valeur.bloque ? 'quiet' : 'danger'}
          label={fiche.valeur.bloque ? 'Débloquer ce membre' : 'Bloquer ce membre'}
          style={{ marginTop: 10 }}
          onPress={basculerLeBlocage}
        />
      </Surface>

      <Feuille visible={motifOuvert} onFermer={() => { void envoyerLeMotif(); }} titre="Signalement envoyé">
        <Body muted style={{ fontSize: 14, lineHeight: 21 }}>
          Tu veux dire pourquoi ? C'est facultatif : le signalement est déjà arrivé.
        </Body>
        <ChipRow
          options={['Démarchage', 'Propos blessants', 'Faux profil', 'Autre']}
          value={raison}
          onChange={(r) => setRaison(r === raison ? '' : r)}
          style={{ marginTop: 14 }}
        />
        <Field label="En quelques mots (facultatif)" value={motif} onChangeText={setMotif} multiline maxLength={500} autoCapitalize="sentences" />
        <Button tone="transforme" label={raison || motif.trim() ? 'Envoyer le motif' : 'Fermer'} style={{ marginTop: 16, marginBottom: 8 }} onPress={() => { void envoyerLeMotif(); }} />
      </Feuille>
    </ClubScreen>
  );
}
