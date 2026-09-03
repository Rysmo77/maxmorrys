import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { openAuthSessionAsync } from 'expo-web-browser';
import {
  AppleMark, Body, Button, Display, Eyebrow, Field, GoogleMark, Icon, IconButton, Screen,
  Surface, Wordmark, isIOS, useToken,
} from '../ds';
import { MOI, SITE } from '../contenu/demo';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 1 · LA CONNEXION ══ — ET LA RÈGLE DE MAGASIN QUI DESSINE UN BOUTON.
 *
 * **APP STORE 4.8 : « Se connecter avec Apple » est OBLIGATOIRE dès qu'on propose une
 * connexion tierce.** Offrir Google sans Apple fait rejeter l'application. Le bouton n'existe
 * donc que dans le châssis iOS — et c'est, avec l'écran de création, l'UN DES DEUX SEULS
 * ENDROITS DU KIT où le CONTENU diffère d'une plateforme à l'autre, et pas seulement le cadre.
 *
 * La conséquence descend jusqu'à l'encart : « trois moyens » d'un côté, « deux » de l'autre.
 * Écrire « trois » sur Android serait faux, et c'est le genre de faux qu'on ne voit jamais
 * parce qu'on relit toujours sur la même plateforme.
 *
 * ⚠️ L'ASSET D'APPLE EST UN EMPLACEMENT RÉSERVÉ (voir `ds/BrandMarks.tsx`). Apple fournit sa
 * marque et impose son usage ; elle ne se redessine pas. À remplacer avant soumission.
 *
 * ── LE MOT DE PASSE, LUI, N'EST PAS ENCORE TENU ICI ──────────────────────────────────────
 * Le SDK d'authentification n'est pas branché. Les champs sont RÉELS — un vrai `TextInput`,
 * le bon clavier, le bon `textContentType`, donc le trousseau propose le mot de passe — mais
 * la validation ouvre la session web, avec les mêmes cookies. Ne pas faire semblant d'avoir ce
 * qu'on n'a pas (AD-11, même raisonnement que pour le paiement).
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Connexion() {
  const t = useToken();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [visible, setVisible] = useState(false);

  async function ouvrirLaSession(chemin: string) {
    await openAuthSessionAsync(`${SITE}${chemin}`, 'rysmo://connexion/retour');
  }

  return (
    <Screen
      territory="forme"
      center
      droite={
        <IconButton label="Fermer" onPress={() => router.back()}>
          <Icon name="close" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
    >
      <Wordmark brand="rysmo" size={30} />
      <Display size={29} lines={['CONTENT DE', 'TE REVOIR.']} style={{ marginTop: 18 }} />

      <Surface level="hero" style={{ marginTop: 20, padding: 20 }}>
        {/* iOS SEULEMENT — App Store 4.8. Le bouton est en tête : c'est la position
            qu'Apple attend quand plusieurs connexions tierces sont proposées. */}
        {isIOS ? (
          <Button
            tone="ink"
            label="Continuer avec Apple"
            leading={<AppleMark />}
            style={{ marginBottom: 9 }}
            onPress={() => { void ouvrirLaSession('/connexion?fournisseur=apple'); }}
          />
        ) : null}

        <Button
          tone="ghost"
          label="Continuer avec Google"
          leading={<GoogleMark />}
          onPress={() => { void ouvrirLaSession('/connexion?fournisseur=google'); }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t('borderHair') }} />
          <Eyebrow>ou</Eyebrow>
          <View style={{ flex: 1, height: 1, backgroundColor: t('borderHair') }} />
        </View>

        <Field
          label="Ton e-mail"
          value={email}
          onChangeText={setEmail}
          placeholder={MOI?.email ?? 'ton@adresse.sn'}
          keyboardType="email-address"
          textContentType="emailAddress"
          style={{ marginTop: 0 }}
        />
        <Field
          label="Ton mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry={!visible}
          textContentType="password"
          trailing={
            <IconButton
              label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              onPress={() => setVisible(!visible)}
              style={{ backgroundColor: 'transparent', borderWidth: 0 }}
            >
              <Icon name="eye" size={18} color={t('ink2')} />
            </IconButton>
          }
        />

        <Button
          tone="forme"
          label="Je me connecte"
          style={{ marginTop: 17 }}
          onPress={() => { void ouvrirLaSession('/connexion'); }}
        />
        <Button
          tone="quiet"
          label="Mot de passe oublié ?"
          style={{ marginTop: 10 }}
          onPress={() => router.push('/mot-de-passe')}
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>{isIOS ? 'Trois moyens, un seul compte' : 'Deux moyens, un seul compte'}</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          {isIOS
            ? 'Apple, Google ou ton e-mail : tu retrouves les mêmes cours, la même progression, les mêmes certificats. Ce n’est pas trois comptes.'
            : 'Google ou ton e-mail : tu retrouves les mêmes cours, la même progression, les mêmes certificats. Ce n’est pas deux comptes.'}
        </Body>
      </Surface>

      <Button
        tone="quiet"
        label="Créer un compte, c'est gratuit"
        style={{ marginTop: 18 }}
        onPress={() => router.push('/creation')}
      />
    </Screen>
  );
}
