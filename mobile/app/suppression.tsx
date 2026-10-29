import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Field, Heros, Icon, SansDonnees, Screen, Surface, haptique, isIOS,
  useBandeau, useToken, veil, Ligne, Liste,
} from '../ds';
import { useSession } from '../donnees/session';
import { effacerHorsLigne } from '../donnees/hors-ligne';
import { getAuthNatif } from '../donnees/firebase';
import { ErreurAppel, appeler } from '../donnees/appel';
import { exporterMesDonnees } from '../donnees/rgpd';
import { deconnexion } from '../donnees/identite';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 4 · LA SUPPRESSION DE COMPTE ══ — FAISABLE **DANS** L'APP, SANS LIEN SORTANT.
 *
 * **App Store 5.1.1(v) l'exige** : un lien vers le site ne suffit pas. Le web le faisait déjà
 * bien ; ici ça devient obligatoire au lieu d'être vertueux — et c'est la seule règle de
 * magasin du kit qui va dans le même sens que la marque.
 *
 * ── L'ORDRE DE L'ÉCRAN EST L'ORDRE D'UNE DÉCISION ────────────────────────────────────────
 *   1 · CE QUI PART, nommé, chiffré, sans euphémisme — « accès à vie perdu, sans remboursement ».
 *   2 · CE QUI RESTE. Les certificats déjà émis restent vérifiables : c'est le principe même
 *       d'un certificat, et le taire ferait renoncer quelqu'un pour une mauvaise raison.
 *   3 · LA CONFIRMATION ÉCRITE. Taper SUPPRIMER n'est pas une friction décorative : c'est ce
 *       qui distingue un geste voulu d'un doigt qui a glissé sur un écran de réglages.
 *
 * ET LA SORTIE DE SECOURS EST À CÔTÉ DU BOUTON ROUGE : « j'exporte d'abord mes données ». La
 * plupart des gens qui suppriment veulent en fait récupérer ce qu'ils ont écrit.
 */
/*
 * CHAQUE LIGNE EST UN RELEVÉ, et sans relevé elle perd son chiffre — pas sa ligne. « Tes notes
 * personnelles » reste vrai sans savoir combien ; « Tes 14 notes » ne l'est que si on a compté.
 * C'est l'écran où un chiffre faux coûte le plus : on décide de supprimer d'après lui.
 */
/* La liste dit ce qui part, sans chiffre de démonstration : « Tes 14 notes » venait du
   contenu d'exemple, et « accès à vie perdu » parlait d'achat. */
const CE_QUI_PART = [
  { titre: 'Tes inscriptions et leur progression', meta: 'les formations ouvertes sur ce compte' },
  { titre: 'Tes notes personnelles', meta: 'elles ne sont nulle part ailleurs' },
  { titre: 'La mémoire de ton répétiteur', meta: 'effaçable seule, sans supprimer le compte' },
  { titre: 'Ton abonnement au Club, s’il est actif', meta: 'il s’arrête avec le compte' },
  /* La déconnexion GARDE les leçons et la file (une file non envoyée est un geste de la
     personne) ; la suppression du compte efface tout (`effacerHorsLigne`). */
  { titre: 'Les leçons gardées et la file d’envoi de ce téléphone', meta: 'effacées avec le compte' },
];

const MOT = 'SUPPRIMER';

export default function Suppression() {
  const t = useToken();
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [supprime, setSupprime] = useState(false);
  const session = useSession();
  const { bandeau, montrer } = useBandeau();
  const correspond = saisie.trim().toUpperCase() === MOT;

  /**
   * ⚠️ ON APPELLE LE SERVEUR, PAS `deleteUser(auth.currentUser)`.
   *
   * La suppression côté client jette `auth/requires-recent-login` dès que la session date de
   * plus de quelques minutes — c'est-à-dire presque toujours. Il faudrait alors redemander le
   * mot de passe SUR CET ÉCRAN, au moment le plus chargé de l'application, pour une raison
   * que personne ne comprendrait. La callable, elle, supprime avec un compte de service et
   * n'a besoin d'aucune ré-authentification.
   *
   * On envoie la CONSTANTE `MOT`, pas `saisie` : le bouton est déjà gardé sur `correspond`,
   * et transmettre la valeur canonique retire au passage un mode d'échec sur un espace ou
   * un accent que le serveur comparerait autrement.
   */
  async function effacerVraiment() {
    setEnCours(true);
    try {
      const uid = getAuthNatif()?.currentUser?.uid ?? null;
      await appeler('deleteUserAccount', { confirmation: MOT });
      if (uid) await effacerHorsLigne(uid);
      await deconnexion();
      /* UN ÉCRAN D'ADIEU, pas l'écran de connexion : la personne qui venait de supprimer son
         compte lisait « CONTENT DE TE REVOIR ». */
      setSupprime(true);
    } catch (erreur: unknown) {
      setEnCours(false);
      montrer(
        'stop',
        "La suppression n'a pas abouti",
        erreur instanceof ErreurAppel
          ? `${erreur.motif} Ton compte n'est pas touché — rien n'a été supprimé à moitié.`
          : "Ton compte n'est pas touché. Réessaie dans un moment.",
      );
    }
  }

  /**
   * L'EXPORT, QUI NE FAISAIT RIEN. Ce bouton appelait `router.back()` : il renvoyait à
   * l'écran précédent sans rien exporter, sur l'écran où quelqu'un vient précisément
   * chercher ses données avant de tout perdre. `exportUserData` existait pourtant déjà.
   *
   * Le lien est SIGNÉ et vaut 24 heures ; il s'ouvre dans la feuille intégrée, d'où le
   * fichier se partage ou s'enregistre avec les gestes du système.
   */
  async function exporter() {
    setEnCours(true);
    try {
      await exporterMesDonnees();
    } catch (erreur: unknown) {
      montrer('stop', "L'export n'a pas abouti", erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.');
    } finally {
      setEnCours(false);
    }
  }

  function supprimer() {
    haptique.attention();
    Alert.alert(
      'Supprimer définitivement ton compte ?',
      "C'est immédiat et sans retour. Tes certificats déjà émis restent vérifiables par leur code.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => { void effacerVraiment(); },
        },
      ],
    );
  }

  if (supprime) {
    return (
      <Screen territory="transforme" espace="hub" center>
        <Heros>
          <View style={{ width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: veil(t('ink'), 0.08) }}>
            <Icon name="check" size={26} color={t('ink2')} strokeWidth={2.6} />
          </View>
        </Heros>
        <Display size={29} lines={['TON COMPTE', 'EST SUPPRIMÉ.']} style={{ marginTop: 22 }} />
        <Body muted style={{ marginTop: 12, fontSize: 15, lineHeight: 22 }}>
          Tout ce qui lui était rattaché est effacé, sur le serveur comme sur ce téléphone. Tes
          certificats déjà émis restent vérifiables par leur code. Merci pour ce bout de chemin.
        </Body>
        <Button tone="quiet" label="Fermer" style={{ marginTop: 22 }} onPress={() => router.replace('/espace')} />
      </Screen>
    );
  }

  /* Sans session, il n'y a rien à supprimer : le formulaire n'a pas lieu d'être. */
  if (session.phase !== 'connectee') {
    return (
      <Screen territory="transforme" espace="hub" retour="Profil" titre={isIOS ? undefined : 'Supprimer mon compte'}>
        <SansDonnees
          quoi="ton compte"
          etat={session.phase === 'restauration' ? { phase: 'restauration', valeur: null } : { phase: 'anonyme', valeur: null }}
          action={<Button tone="forme" label="Me connecter" onPress={() => router.push('/connexion')} />}
          style={{ marginTop: 10 }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      territory="transforme"
      espace="hub"
      retour="Profil"
      titre={isIOS ? undefined : 'Supprimer mon compte'}
    >
      <Display size={27} lines={['Ce qui part', 'avec ton compte.']} style={{ marginTop: 10 }} />
      {bandeau}

      <Liste style={{ marginTop: 20 }}>
        {CE_QUI_PART.map((l) => (
          <Ligne
            key={l.titre}
            titre={l.titre}
            sous={l.meta}
          />
        ))}
      </Liste>

      <Surface level="flat" style={{ marginTop: 14, padding: 18, borderColor: veil(t('ok'), 0.28) }}>
        <Body style={{ fontSize: 14.5, fontWeight: '700', color: t('ok') }}>Ce qui reste</Body>
        <Body muted style={{ marginTop: 6, fontSize: 13, lineHeight: 20 }}>
          Tes certificats déjà émis restent vérifiables par leur code — c'est le principe même
          d'un certificat. Le miroir public ne porte aucun identifiant de compte.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 14, padding: 19 }}>
        <Field
          label={`Écris ${MOT} pour confirmer`}
          value={saisie}
          onChangeText={setSaisie}
          placeholder={MOT}
          autoCapitalize="characters"
          autoCorrect={false}
          error={saisie.length > 0 && !correspond ? 'Le texte ne correspond pas encore.' : undefined}
          style={{ marginTop: 0 }}
        />
        <Button
          tone="danger"
          icon="trash"
          label={enCours ? 'Suppression…' : 'Supprimer définitivement'}
          disabled={!correspond || enCours}
          style={{ marginTop: 16 }}
          onPress={supprimer}
        />
        <Button
          tone="quiet"
          label="J'exporte d'abord mes données"
          disabled={enCours}
          style={{ marginTop: 9 }}
          onPress={() => { void exporter(); }}
        />
      </Surface>
    </Screen>
  );
}
