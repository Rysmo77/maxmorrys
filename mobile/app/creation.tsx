import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Field, Icon, Screen,
  Surface, isIOS, useToken,
} from '../ds';
import { ErreurIdentite, creationEmail } from '../donnees/identite';

/**
 * ══ 2 · LA CRÉATION DE COMPTE ══
 *
 * **LA CASE DE CONSENTEMENT N'EST JAMAIS PRÉ-COCHÉE**, et le consentement est HORODATÉ. Ce
 * n'est pas une précaution juridique ajoutée après coup : la règle de la base refuse une
 * inscription sans lui, donc l'écran ne peut pas mentir même s'il le voulait. Créer un compte
 * n'inscrit à rien d'autre.
 *
 * COMME POUR LA CONNEXION, cette version ne propose que l'e-mail. Apple et Google partiront
 * ensemble, dans une même livraison : App Store 4.8 rend « Se connecter avec Apple »
 * obligatoire dès qu'une connexion tierce existe, et livrer Google seul fait rejeter.
 *
 * ⚠️ LE FAUX LIEN A ÉTÉ RETIRÉ D'ICI. « Politique de confidentialité » était rendue en bleu
 * et en gras — la forme d'un lien — À L'INTÉRIEUR du `Pressable` de la case newsletter : la
 * toucher cochait la case au lieu d'ouvrir le texte. Une fausse affordance posée sur un
 * contrôle de consentement, à l'endroit où elle coûte le plus cher. Les textes ont désormais
 * leur ligne à eux, hors de la case, comme App Store 5.1.1(i) l'exige au point d'inscription.
 *
 * ── CE QUE LES CHAMPS FONT DÉJÀ, ET QUI COMPTE PLUS QU'ON NE CROIT ───────────────────────
 * `textContentType` décide de ce que le trousseau propose, et `keyboardType` de ce qui s'ouvre
 * sous le doigt. Un clavier alphabétique sur un champ d'e-mail, c'est dix secondes de saisie
 * en plus par personne, sur l'écran où l'on décide de rester ou pas.
 */
export default function Creation() {
  const t = useToken();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [lettre, setLettre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  const complet = nom.trim() !== '' && email.trim() !== '' && motDePasse.length >= 8;

  async function creer() {
    if (!complet || enCours) return;
    setEnCours(true);
    setEchec(null);
    try {
      await creationEmail(nom, email, motDePasse);
      router.replace('/(tabs)');
    } catch (erreur: unknown) {
      setEchec(erreur instanceof ErreurIdentite ? erreur.motif : 'La création a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Screen
      territory="forme"
      retour="Connexion"
      titre={isIOS ? undefined : 'Créer un compte'}
    >
      <Display size={29} lines={['ON COMMENCE', 'PAR TOI.']} style={{ marginTop: 10 }} />

      <Surface level="hero" style={{ marginTop: 20, padding: 20 }}>
        <Field
          label="Ton prénom et ton nom"
          value={nom}
          onChangeText={setNom}
          placeholder="Prénom Nom"
          autoCapitalize="words"
          textContentType="name"
          style={{ marginTop: 0 }}
        />
        <Field
          label="Ton e-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="ton@adresse.sn"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Ton mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          textContentType="password"
          hint="Huit caractères au minimum."
          error={echec ?? undefined}
        />

        {/* ── LA CASE. Jamais pré-cochée, et sa cible fait toute la ligne. ─────────────── */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: lettre }}
          accessibilityLabel="Recevoir la lettre d'information"
          onPress={() => setLettre(!lettre)}
          style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginTop: 16 }}
        >
          <View style={{
            width: 24, height: 24, borderRadius: 7, marginTop: 1,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: lettre ? t('ink') : t('ctlRadioBrd'),
            backgroundColor: lettre ? t('ink') : t('ctlOffBg'),
          }}>
            {lettre ? <Icon name="check" size={14} color={t('textOnPrimary')} strokeWidth={3.4} /> : null}
          </View>
          <Body muted style={{ flex: 1, fontSize: 12.5, lineHeight: 18 }}>
            Je veux recevoir la lettre d'information. Je peux me désinscrire à tout moment.
          </Body>
        </Pressable>

        {/* ── LES TEXTES, HORS DE LA CASE. ────────────────────────────────────────────────
            Leur place est ici — App Store 5.1.1(i) les veut au point d'inscription — et
            SURTOUT pas à l'intérieur du `Pressable` au-dessus : un lien qui coche une case
            n'est pas un lien. Cette ligne-ci ouvre vraiment. */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Lire les textes légaux"
          onPress={() => router.push('/legal')}
          style={{ marginTop: 14 }}
        >
          <Body muted style={{ fontSize: 12, lineHeight: 18 }}>
            En créant un compte, tu acceptes les{' '}
            <Body style={{ fontSize: 12, color: t('mmBleu'), fontWeight: '700' }}>
              conditions d'utilisation et la politique de confidentialité
            </Body>.
          </Body>
        </Pressable>

        <Button
          tone="forme"
          label={enCours ? 'Création…' : 'Crée mon compte'}
          disabled={!complet || enCours}
          style={{ marginTop: 17 }}
          onPress={() => { void creer(); }}
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Cette case n'est jamais pré-cochée</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Le consentement est horodaté, et la règle de la base refuse une inscription sans lui.
          Créer un compte n'inscrit à rien d'autre.
        </Body>
      </Surface>

      <Button
        tone="quiet"
        label="J'ai déjà un compte"
        style={{ marginTop: 16 }}
        onPress={() => router.back()}
      />
    </Screen>
  );
}
