import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  Body, Button, ChipRow, Display, Eyebrow, Field, Icon, IconButton, SansDonnees, Screen, Surface,
  Switch, TUTOR_DEFAUT, haptique, isIOS, useBandeau, useConfirmation, useToken, useTutorNom,
  Ligne, Liste, Rubrique,
} from '../ds';
import { ErreurAppel, effacerLaMemoire, reglerLeRepetiteur, useRepetiteur } from '../donnees';
import { useSession } from '../donnees/session';
import { router } from 'expo-router';

/**
 * ══ 2 · LA MÉMOIRE DE PROFIL ══ — PORTÉE SANS UNE LIGNE DE DIFFÉRENCE.
 *
 * C'est déjà l'écran où se règle la RELATION, et le natif n'y change rien : ni le contenu, ni
 * l'ordre, ni la voix. Il est ici parce que la conversation seule ne suffit pas — quelqu'un
 * doit pouvoir voir ce que le tuteur a retenu, et le retirer.
 *
 * ── LE RENOMMAGE RESTE EN TÊTE ────────────────────────────────────────────────────────────
 * Avant la liste, avant l'effacement. Donner un nom est le premier geste qui transforme un
 * automate en interlocuteur, et c'est ce que la barre d'onglets affichera ensuite.
 *
 * ⚠️ LE NOM NE SE PERSISTE PAS LOCALEMENT, ET IL NE DOIT PAS. Il vit dans le profil
 * (`users/<uid>.tutorName`), comme au web : un magasin local créerait une seconde source de
 * vérité à réconcilier, et deux appareils afficheraient deux noms. `setTutorNom()` est un
 * cache de session, à alimenter depuis le profil au démarrage.
 *
 * ── ET L'EFFACEMENT NE PREND PAS LE NOM AVEC LUI ──────────────────────────────────────────
 * Effacer la mémoire, c'est retirer des FAITS ; le nom est un RÉGLAGE. Les confondre ferait
 * perdre le nom à quelqu'un qui voulait seulement corriger ce que son tuteur croyait savoir.
 */
const PROPOSITIONS = ['Répétiteur', 'Prof', 'Coach', 'Tonton'] as const;

export default function Memoire() {
  const rep = useRepetiteur();
  const session = useSession();
  const [efface, setEfface] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const memoire = efface ? [] : rep.valeur?.memoire ?? [];
  const t = useToken();
  const tuteur = useTutorNom();
  const { bandeau, montrer } = useBandeau();
  const enregistre = useConfirmation();

  /*
   * LE NOM SE TAPE LIBREMENT ET S'ENREGISTRE DANS LE PROFIL. Il était recalculé à chaque
   * frappe — un espace disparaissait aussitôt — et oublié au redémarrage.
   */
  const [brouillon, setBrouillon] = useState(tuteur);
  useEffect(() => { setBrouillon(tuteur); }, [tuteur]);
  const aEnregistrer = brouillon.trim() !== tuteur && !(brouillon.trim() === '' && tuteur === TUTOR_DEFAUT);

  async function enregistrer(nom: string) {
    setBrouillon(nom);
    if (session.phase !== 'connectee') {
      montrer('info', 'Connecte-toi pour le renommer', "Le nom vit dans ton profil, pour te suivre d'un appareil à l'autre.");
      return;
    }
    try {
      await reglerLeRepetiteur({ nom: nom.trim() });
      enregistre.confirmer(`${nom.trim() || TUTOR_DEFAUT} enregistré`);
    } catch (erreur: unknown) {
      setBrouillon(tuteur);
      montrer('stop', "Le nom n'a pas été enregistré", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    }
  }

  /*
   * ── LA MÉMOIRE SE COUPE ICI ──────────────────────────────────────────────────────────
   * Elle était ACTIVE PAR DÉFAUT côté serveur, et rien dans l'application ne permettait de
   * l'arrêter : on pouvait l'effacer, pas l'empêcher de recommencer. L'interrupteur dit
   * l'état réel, et il l'écrit dans le profil.
   */
  const [memoireActive, setMemoireActive] = useState<boolean | null>(null);
  useEffect(() => { if (rep.valeur) setMemoireActive(rep.valeur.memoireActive); }, [rep.valeur]);
  async function basculerMemoire() {
    if (memoireActive === null) return;
    const suivante = !memoireActive;
    setMemoireActive(suivante);
    try {
      await reglerLeRepetiteur({ memoire: suivante });
    } catch (erreur: unknown) {
      setMemoireActive(!suivante);
      montrer('stop', "Le réglage n'a pas changé", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    }
  }

  /*
   * ⚠️ CE BOUTON N'AVAIT AUCUN GESTIONNAIRE. L'alerte s'ouvrait, on touchait « Tout
   * effacer », et elle se fermait sans rien effacer. Sur une action DESTRUCTIVE, c'est la
   * pire forme de contrôle mort. La callable `clearRysmoMemory` existait pourtant déjà.
   */
  async function effacerVraiment() {
    setEnCours(true);
    try {
      await effacerLaMemoire();
      /* On vide l'affichage tout de suite : relire pour constater un vide qu'on vient de
         provoquer ferait clignoter la liste, et coûterait un aller-retour pour rien. */
      setEfface(true);
      haptique.succes();
      montrer('ok', 'Mémoire effacée', 'Il ne sait plus rien de toi. Il réapprendra seulement si sa mémoire reste active.');
    } catch (erreur: unknown) {
      montrer(
        'stop',
        "La mémoire n'a pas été effacée",
        erreur instanceof ErreurAppel
          ? `${erreur.motif} Rien n'a été supprimé à moitié.`
          : "Rien n'a été supprimé. Réessaie dans un moment.",
      );
    } finally {
      setEnCours(false);
    }
  }

  function toutEffacer() {
    haptique.attention();
    Alert.alert(
      'Effacer toute la mémoire ?',
      "Immédiat, et sans passer par le support. Le nom que tu lui as donné ne s'efface pas avec.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Tout effacer', style: 'destructive', onPress: () => { void effacerVraiment(); } },
      ],
    );
  }

  return (
    <Screen
      territory="transforme"
      espace="ia"
      retour={tuteur}
      titre={isIOS ? undefined : 'Mémoire de profil'}
      droite={
        <IconButton label="Fermer" onPress={() => router.back()}>
          <Icon name="close" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
    >
      {bandeau}
      <Eyebrow style={{ marginTop: 6 }}>Ton répétiteur</Eyebrow>
      <Display size={29} lines={['DONNE-LUI', 'UN NOM.']} style={{ marginTop: 8 }} />

      <Surface level="hero" style={{ marginTop: 18, padding: 19 }}>
        <Field
          label="Comment tu l'appelles"
          value={brouillon}
          onChangeText={setBrouillon}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={() => { if (aEnregistrer) void enregistrer(brouillon); }}
          hint={enregistre.confirme ? 'Enregistré dans ton profil.' : `Par défaut, il s'appelle ${TUTOR_DEFAUT}.`}
          style={{ marginTop: 0 }}
        />
        <ChipRow
          options={PROPOSITIONS}
          value={PROPOSITIONS.find((p) => p === brouillon) ?? ''}
          onChange={(p) => { void enregistrer(p); }}
          style={{ marginTop: 13 }}
        />
        {aEnregistrer ? (
          <Button tone="transforme" size="sm" label="Enregistrer le nom" style={{ marginTop: 12 }} onPress={() => { void enregistrer(brouillon); }} />
        ) : null}
        <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
          Le nom ne change que pour toi. <Body style={{ fontWeight: '700', fontSize: 12 }}>Rysmo</Body> reste
          le nom de l'application.
        </Body>
      </Surface>

      <Rubrique>Sa mémoire</Rubrique>
      <Liste>
        <Ligne
          icone="brain"
          fondIcone={t('mmViolet')}
          titre="Retenir ce que je lui dis"
          sous={memoireActive === false
            ? "il ne retient rien de nouveau"
            : 'tes objectifs, ton activité, tes difficultés'}
          droite={memoireActive === null
            ? <Switch disabled label="Retenir ce que je lui dis — en lecture" />
            : <Switch on={memoireActive} label="Retenir ce que je lui dis" onPress={() => { void basculerMemoire(); }} />}
        />
      </Liste>

      <Eyebrow style={{ marginTop: 24 }}>Ce qu'il a retenu</Eyebrow>
      {memoire.length === 0 ? (
        /* Pendant la lecture, « rien de gardé » clignotait avant la liste : l'état décide. */
        <SansDonnees
          quoi="ce qu'il a retenu"
          etat={efface ? { phase: 'vide', valeur: null, source: 'server', asOf: new Date() } : rep}
          hauteur={3}
          degat="Un souvenir inventé ferait croire qu'il sait de toi une chose que tu ne lui as jamais dite."
          style={{ marginTop: 10 }}
        />
      ) : (
        <Liste>
          {/* Les poubelles par ligne sont parties : elles étaient rouges, désactivées, et ne
              faisaient rien — l'oubli ligne par ligne n'existe pas côté serveur. */}
          {memoire.map((m) => (
            <Ligne
              key={m.id}
              icone="chat"
              fondIcone={t('mmViolet')}
              titre={m.fait}
              sous={m.depuis ?? undefined}
            />
          ))}
        </Liste>
      )}

      <Button
        tone="danger"
        label={enCours ? 'Effacement…' : 'Tout effacer'}
        icon="trash"
        disabled={enCours || memoire.length === 0}
        style={{ marginTop: 14 }}
        onPress={toutEffacer}
      />
    </Screen>
  );
}
