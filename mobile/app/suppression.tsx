import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Field, LessonRow, Screen, Surface, isIOS, useToken, veil,
} from '../ds';
import { CLUB, NOTES_TOTAL, STOCKAGE } from '../contenu/demo';
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
const CE_QUI_PART = [
  { titre: 'Tes inscriptions et leur progression', meta: 'accès à vie perdu, sans remboursement' },
  { titre: NOTES_TOTAL ? `Tes ${NOTES_TOTAL.notes} notes personnelles` : 'Tes notes personnelles', meta: "elles ne sont nulle part ailleurs" },
  { titre: 'La mémoire de ton répétiteur', meta: 'effaçable seule, sans supprimer le compte' },
  { titre: 'Ton abonnement au Club', meta: CLUB ? `échéance au ${CLUB.echeance}, non remboursée` : 'non remboursée' },
  { titre: STOCKAGE ? `Les ${STOCKAGE.occupeCourt} téléchargés sur ce téléphone` : 'Ce qui est téléchargé sur ce téléphone', meta: 'supprimés à la déconnexion' },
];

const MOT = 'SUPPRIMER';

export default function Suppression() {
  const t = useToken();
  const [saisie, setSaisie] = useState('');
  const [enCours, setEnCours] = useState(false);
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
      await appeler('deleteUserAccount', { confirmation: MOT });
      await deconnexion();
      router.replace('/connexion');
    } catch (erreur: unknown) {
      setEnCours(false);
      Alert.alert(
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
      Alert.alert(
        "L'export n'a pas abouti",
        erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.',
      );
    } finally {
      setEnCours(false);
    }
  }

  function supprimer() {
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

  return (
    <Screen
      territory="transforme"
      retour="Profil"
      titre={isIOS ? undefined : 'Supprimer mon compte'}
    >
      <Display size={27} lines={['Ce qui part', 'avec ton compte.']} style={{ marginTop: 10 }} />

      <Surface level="flat" style={{ marginTop: 20, paddingHorizontal: 16 }}>
        {CE_QUI_PART.map((l, i) => (
          <LessonRow key={l.titre} title={l.titre} meta={l.meta} last={i === CE_QUI_PART.length - 1} />
        ))}
      </Surface>

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
          autoCapitalize="none"
          error={saisie.length > 0 && !correspond ? 'Le texte ne correspond pas encore.' : undefined}
          style={{ marginTop: 0 }}
        />
        <Button
          tone="primary"
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

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Pourquoi tout se passe ici</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          La suppression se fait <Body style={{ fontWeight: '700', fontSize: 12.5 }}>dans l'app</Body>,
          sans lien vers le site et sans écrire au support. C'est la règle de l'App Store, et
          c'était déjà la nôtre.
        </Body>
      </Surface>
    </Screen>
  );
}
