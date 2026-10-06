import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { apresConnexion } from '../donnees/accueil';
import {
  Body, Button, Display, Field, Icon, Screen,
  Surface, haptique, isIOS, useBandeau, useToken,
} from '../ds';
import { ErreurIdentite, avecGoogle, creationEmail } from '../donnees/identite';
import { BoutonGoogle } from '../ecrans/BoutonGoogle';

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
  const [visible, setVisible] = useState(false);
  const [lettre, setLettre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  /* L'ERREUR VA SOUS LE CHAMP QU'ELLE CONCERNE. « Un compte existe déjà avec cette adresse »
     s'affichait sous le MOT DE PASSE — on corrigeait le mauvais champ. */
  const [erreurs, setErreurs] = useState<{ email?: string; motDePasse?: string }>({});
  const { bandeau, montrer, effacer } = useBandeau();
  const champEmail = useRef<TextInput>(null);
  const champMotDePasse = useRef<TextInput>(null);

  const manque = Math.max(0, 8 - motDePasse.length);
  const complet = nom.trim() !== '' && email.trim() !== '' && manque === 0;
  /* LE BOUTON ÉTEINT DIT POURQUOI. Il restait gris sans un mot : on ne savait pas qu'il
     manquait deux caractères au mot de passe. */
  const raison = nom.trim() === '' ? 'Il manque ton nom.'
    : email.trim() === '' ? 'Il manque ton e-mail.'
      : manque > 0 ? `Encore ${manque} caractère${manque > 1 ? 's' : ''} au mot de passe.`
        : null;

  async function creer() {
    if (!complet || enCours) return;
    setEnCours(true);
    setErreurs({});
    effacer();
    try {
      await creationEmail(nom, email, motDePasse);
      haptique.succes();
      router.replace(await apresConnexion());
    } catch (erreur: unknown) {
      const e = erreur instanceof ErreurIdentite ? erreur : null;
      if (e && (e.code === 'auth/email-already-in-use' || e.code === 'auth/invalid-email')) setErreurs({ email: e.motif });
      else if (e && e.code === 'auth/weak-password') setErreurs({ motDePasse: e.motif });
      else montrer('stop', "Le compte n'a pas été créé", e ? e.motif : 'Réessaie dans un moment.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Screen
      territory="forme"
      retour="Retour"
      titre={isIOS ? undefined : 'Créer un compte'}
    >
      <Display size={29} lines={['ON COMMENCE', 'PAR TOI.']} style={{ marginTop: 10 }} />
      {bandeau}

      <Surface level="hero" style={{ marginTop: 20, padding: 20 }}>
        <Field
          label="Ton prénom et ton nom"
          value={nom}
          onChangeText={setNom}
          placeholder="Prénom Nom"
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => champEmail.current?.focus()}
          style={{ marginTop: 0 }}
        />
        <Field
          ref={champEmail}
          label="Ton e-mail"
          value={email}
          onChangeText={(v) => { setEmail(v); if (erreurs.email) setErreurs({}); }}
          placeholder="ton@adresse.sn"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => champMotDePasse.current?.focus()}
          error={erreurs.email}
        />
        {/* `newPassword` : iOS propose un mot de passe fort et l'enregistre au trousseau. */}
        <Field
          ref={champMotDePasse}
          label="Ton mot de passe"
          value={motDePasse}
          onChangeText={(v) => { setMotDePasse(v); if (erreurs.motDePasse) setErreurs({}); }}
          secureTextEntry={!visible}
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={() => { void creer(); }}
          hint={manque > 0 ? `Huit caractères au minimum — encore ${manque}.` : 'Huit caractères au minimum.'}
          error={erreurs.motDePasse}
          trailing={(
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              onPress={() => setVisible(!visible)}
              hitSlop={10}
            >
              <Icon name={visible ? 'eye-off' : 'eye'} size={18} color={t('ink2')} />
            </Pressable>
          )}
        />

        {/* ── LA CASE. Jamais pré-cochée, et sa cible fait toute la ligne. ─────────────── */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: lettre }}
          accessibilityLabel="Recevoir la lettre d'information"
          onPress={() => { haptique.selection(); setLettre(!lettre); }}
          style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginTop: 16, minHeight: 44 }}
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

        {/* ── LES TEXTES, HORS DE LA CASE — App Store 5.1.1(i) les veut au point
            d'inscription, et un lien qui coche une case n'est pas un lien. */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Lire les textes légaux"
          onPress={() => router.push('/legal')}
          style={{ marginTop: 14 }}
        >
          <Body muted style={{ fontSize: 12.5, lineHeight: 18 }}>
            En créant un compte, tu acceptes les{' '}
            <Body style={{ fontSize: 12.5, color: t('mmBleu'), fontWeight: '700' }}>
              conditions d'utilisation et la politique de confidentialité
            </Body>.
          </Body>
        </Pressable>

        <Button
          tone="forme"
          label={enCours ? 'Création…' : 'Créer mon compte'}
          disabled={!complet || enCours}
          style={{ marginTop: 17 }}
          onPress={() => { void creer(); }}
        />
        {raison && !enCours ? (
          <Body muted style={{ fontSize: 12.5, textAlign: 'center', marginTop: 8 }}>{raison}</Body>
        ) : null}
      </Surface>

      {/* Android seulement : sur iOS, Google attend « Se connecter avec Apple » (App Store 4.8). */}
      {avecGoogle ? (
        <>
          <Body muted style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5 }}>ou</Body>
          <BoutonGoogle style={{ marginTop: 10 }} />
        </>
      ) : null}

      {/* L'encart « cette case n'est jamais pré-cochée » est parti : il expliquait la règle
          de la base à la personne qui s'inscrit. La case, elle, le montre. */}
      <Button
        tone="quiet"
        label="J'ai déjà un compte"
        style={{ marginTop: 16 }}
        onPress={() => router.replace('/connexion')}
      />
    </Screen>
  );
}
