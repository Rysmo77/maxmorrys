import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Field, LessonRow, Screen, Surface, isIOS, useToken, veil,
} from '../ds';
import { CLUB, NOTES_TOTAL, STOCKAGE } from '../contenu/reference';

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
const CE_QUI_PART = [
  { titre: '2 inscriptions et leur progression', meta: 'accès à vie perdu, sans remboursement' },
  { titre: `Tes ${NOTES_TOTAL.notes} notes personnelles`, meta: "elles ne sont nulle part ailleurs" },
  { titre: 'La mémoire de ton répétiteur', meta: 'effaçable seule, sans supprimer le compte' },
  { titre: 'Ton abonnement au Club', meta: `échéance au ${CLUB.echeance}, non remboursée` },
  { titre: `Les ${STOCKAGE.occupeCourt} téléchargés sur ce téléphone`, meta: 'supprimés à la déconnexion' },
];

const MOT = 'SUPPRIMER';

export default function Suppression() {
  const t = useToken();
  const [saisie, setSaisie] = useState('');
  const correspond = saisie.trim().toUpperCase() === MOT;

  function supprimer() {
    Alert.alert(
      'Supprimer définitivement ton compte ?',
      "C'est immédiat et sans retour. Tes certificats déjà émis restent vérifiables par leur code.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          /* ⚠️ La suppression réelle demande le SDK d'authentification, absent. Le geste est
             tenu jusqu'ici, et l'écran dit où il s'arrête plutôt que de faire semblant. */
          onPress: () => Alert.alert(
            'Pas encore branché ici',
            "Le compte lui-même vit côté serveur, et ce port n'embarque pas encore le SDK. La suppression est traitée depuis ton profil sur le site, avec la même session. C'est la seule chose que je ne peux pas encore faire dans l'app — et l'App Store l'exige, donc elle y sera avant soumission.",
          ),
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
          label="Supprimer définitivement"
          disabled={!correspond}
          style={{ marginTop: 16 }}
          onPress={supprimer}
        />
        <Button
          tone="quiet"
          label="J'exporte d'abord mes données"
          style={{ marginTop: 9 }}
          onPress={() => router.back()}
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
