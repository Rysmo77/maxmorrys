import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { openAuthSessionAsync } from 'expo-web-browser';
import {
  AppleMark, Body, Button, Display, Eyebrow, Field, GoogleMark, Icon, Screen,
  Surface, isIOS, useToken,
} from '../ds';
import { MOI, SITE } from '../contenu/reference';

/**
 * ══ 2 · LA CRÉATION DE COMPTE ══
 *
 * **LA CASE DE CONSENTEMENT N'EST JAMAIS PRÉ-COCHÉE**, et le consentement est HORODATÉ. Ce
 * n'est pas une précaution juridique ajoutée après coup : la règle de la base refuse une
 * inscription sans lui, donc l'écran ne peut pas mentir même s'il le voulait. Créer un compte
 * n'inscrit à rien d'autre.
 *
 * COMME POUR LA CONNEXION, le bouton Apple n'existe que sur iOS (App Store 4.8) — offrir
 * Google sans Apple fait rejeter l'application.
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

  async function creer() {
    await openAuthSessionAsync(`${SITE}/creation`, 'rysmo://connexion/retour');
  }

  return (
    <Screen
      territory="forme"
      retour="Connexion"
      titre={isIOS ? undefined : 'Créer un compte'}
    >
      <Display size={29} lines={['ON COMMENCE', 'PAR TOI.']} style={{ marginTop: 10 }} />

      <Surface level="hero" style={{ marginTop: 20, padding: 20 }}>
        {isIOS ? (
          <Button
            tone="ink"
            label="Continuer avec Apple"
            leading={<AppleMark />}
            style={{ marginBottom: 9 }}
            onPress={() => { void creer(); }}
          />
        ) : null}

        <Button
          tone="ghost"
          label="Continuer avec Google"
          leading={<GoogleMark />}
          onPress={() => { void creer(); }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t('borderHair') }} />
          <Eyebrow>ou</Eyebrow>
          <View style={{ flex: 1, height: 1, backgroundColor: t('borderHair') }} />
        </View>

        <Field
          label="Ton prénom et ton nom"
          value={nom}
          onChangeText={setNom}
          placeholder={MOI.nom}
          autoCapitalize="words"
          textContentType="name"
          style={{ marginTop: 0 }}
        />
        <Field
          label="Ton e-mail"
          value={email}
          onChangeText={setEmail}
          placeholder={MOI.email}
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
            Je veux recevoir la lettre d'information. Je peux me désinscrire à tout moment —
            <Body style={{ fontSize: 12.5, color: t('mmBleu'), fontWeight: '700' }}> politique de confidentialité</Body>.
          </Body>
        </Pressable>

        <Button tone="forme" label="Crée mon compte" style={{ marginTop: 17 }} onPress={() => { void creer(); }} />
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
