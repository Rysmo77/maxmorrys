import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Body, Button, Display, Eyebrow, Field, Mesh, Surface, useToken } from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CONNEXION — ET LE CHAMP QUI N'EST PAS ICI.
 *
 * Ce dossier n'embarque pas de SDK d'authentification : `mobile/package.json` ne dépend pas
 * de `firebase`. Aucun mot de passe tapé sur cet écran ne pourrait donc être vérifié. Deux
 * façons de traiter ce fait, et une seule est tenable :
 *
 *   • Poser le champ quand même, l'envoyer nulle part, et laisser croire. C'est exactement
 *     ce que `app/(tabs)/profil.tsx` refuse — « un bouton qui ne fait rien est pire que son
 *     absence » — et sur un mot de passe le prix de ce mensonge n'est pas le même que sur un
 *     réglage : quelqu'un aurait tapé son secret dans un écran qui n'en fait rien.
 *   • Ne pas le demander, et DIRE pourquoi.
 *
 * D'où l'écran tel qu'il est : l'adresse se tape ici — elle sert à préremplir — et la
 * vérification se fait sur le site, dans une session de navigateur qui partage les cookies
 * du web. C'est le même geste qu'`app/paiement.tsx` fait pour le paiement, et pour une
 * raison de même nature : ce que ce port ne sait pas tenir, il le passe à qui le tient.
 *
 * L'ENCART DE VÉRITÉ DE LA MAQUETTE EST GARDÉ TEL QUEL. « Que tu passes par Google ou par
 * ton e-mail, tu retrouves les mêmes cours » : c'est la question que quelqu'un se pose
 * vraiment devant deux boutons, et la réponse ne dépend pas de la plateforme.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const SITE = 'https://maxmorrys.me';

export default function Connexion() {
  const t = useToken();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [ouverture, setOuverture] = useState(false);

  async function ouvrirLaSession() {
    setOuverture(true);
    try {
      /*
        `openAuthSessionAsync` et non `openBrowserAsync` : la session partage les cookies du
        site, donc quelqu'un déjà connecté sur le web ne se reconnecte pas.

        L'adresse part en paramètre pour préremplir le formulaire. LE MOT DE PASSE, LUI, NE
        TRAVERSE RIEN : il n'est pas saisi ici, donc il n'y a rien à transmettre — ni dans
        une URL, ni ailleurs.
      */
      const q = email.trim() ? `?from=app&email=${encodeURIComponent(email.trim())}` : '?from=app';
      await WebBrowser.openAuthSessionAsync(`${SITE}/connexion${q}`, 'rysmo://connexion/retour');
    } catch {
      // Le motif, la conséquence, la sortie — dans cet ordre. Jamais d'excuse.
      Alert.alert(
        "Le navigateur n'a pas pu s'ouvrir",
        `Ta session n'a pas été ouverte, et rien n'a changé sur ton compte. Ouvre ${SITE}/connexion depuis ton navigateur pour te connecter.`,
      );
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ton compte</Eyebrow>
        <View style={{ marginTop: 10 }}>
          <Display size="sm" lines={['CONTENT DE', 'TE REVOIR.']} />
        </View>

        <Surface level="hero" style={{ marginTop: 20, padding: 22 }}>
          <Field
            label="Ton e-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="aissatou@exemple.sn"
            keyboardType="email-address"
            textContentType="emailAddress"
            hint="Elle sert à préremplir le formulaire du site. Rien d'autre ne part d'ici."
            style={{ marginTop: 0 }}
          />

          <Button
            tone="forme"
            label={ouverture ? 'Ouverture…' : 'Je me connecte'}
            disabled={ouverture}
            onPress={() => void ouvrirLaSession()}
            style={{ marginTop: 18 }}
          />

          {/* On DIT ce qui va se passer AVANT que ça se passe : un navigateur qui s'ouvre
              sans prévenir se lit comme une sortie d'application non voulue. */}
          <Body muted style={{ marginTop: 12, fontSize: 13 }}>
            La connexion s'ouvre dans ton navigateur, sur ta session du site. Tu reviens ici
            tout de suite après. Google et l'e-mail y sont tous les deux.
          </Body>

          <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: t('borderHair') }}>
            <Body muted style={{ fontSize: 12.5 }}>
              Je ne te demande pas ton mot de passe sur cet écran : ce port n'embarque pas de
              quoi le vérifier, et un mot de passe tapé dans un écran qui n'en fait rien est
              un mot de passe de trop.
            </Body>
          </View>
        </Surface>

        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Les deux moyens mènent au même endroit</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Que tu passes par Google ou par ton e-mail, tu retrouves les mêmes cours, la même
            progression, les mêmes certificats. Ce n'est pas deux comptes.
          </Body>
        </Surface>

        <Button
          tone="quiet"
          label="Pas encore de compte ? Crée-le, c'est gratuit"
          onPress={() => router.push('/creation')}
          style={{ marginTop: 20 }}
        />
        <Button
          tone="quiet"
          label="Mot de passe oublié ?"
          onPress={() => router.push('/mot-de-passe')}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </View>
  );
}
