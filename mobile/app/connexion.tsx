import { useState } from 'react';
import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Field, Icon, IconButton, Screen,
  Surface, Wordmark, useToken,
} from '../ds';
import { ErreurIdentite, connexionEmail } from '../donnees/identite';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 1 · LA CONNEXION ══ — elle est branchée, et elle ne propose qu'un seul moyen.
 *
 * ── POURQUOI NI APPLE NI GOOGLE ICI, POUR L'INSTANT ─────────────────────────────────────
 * **App Store 4.8 : « Se connecter avec Apple » devient OBLIGATOIRE dès qu'on propose une
 * connexion tierce.** Les deux boutons doivent donc partir dans la MÊME livraison — offrir
 * Google en version *n* et Apple en *n+1* fait rejeter la version *n*, sans recours.
 *
 * Cette version ne tient que l'e-mail et le mot de passe. C'est délibéré : ça n'appelle
 * aucune obligation, ça n'a besoin d'aucun actif d'Apple (`ds/BrandMarks.tsx` porte une
 * pomme REDESSINÉE, que les HIG interdisent), et ça se vérifie de bout en bout.
 *
 * ⚠️ LA DETTE EST RÉELLE ET IL FAUT LA NOMMER. Le site propose déjà Google. Quelqu'un qui
 * s'y est inscrit par Google n'a jamais choisi de mot de passe : ici, il obtiendra
 * « cette adresse et ce mot de passe ne vont pas ensemble » et essaiera des mots de passe qui
 * n'ont jamais existé. C'est ce qui rend la livraison Google + Apple urgente, pas facultative.
 *
 * ── LE MESSAGE D'ÉCHEC EST VOLONTAIREMENT FLOU, ET C'EST UNE PROTECTION ────────────────
 * Firebase renvoie `auth/invalid-credential` aussi bien pour un mot de passe faux que pour un
 * compte inexistant, exprès : distinguer les deux dirait à n'importe qui quelles adresses
 * sont inscrites. `donnees/identite.ts` garde cette indistinction plutôt que de l'affiner.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Connexion() {
  const t = useToken();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  const complet = email.trim() !== '' && motDePasse !== '';

  async function seConnecter() {
    if (!complet || enCours) return;
    setEnCours(true);
    setEchec(null);
    try {
      await connexionEmail(email, motDePasse);
      /* On ne route PAS ici. `onAuthStateChanged` change la session, et c'est elle qui décide
         où l'on va — router depuis les deux endroits produirait deux navigations pour une
         seule connexion. */
      router.replace('/(tabs)');
    } catch (erreur: unknown) {
      setEchec(erreur instanceof ErreurIdentite ? erreur.motif : 'La connexion a échoué.');
    } finally {
      setEnCours(false);
    }
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
        <Field
          label="Ton e-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="ton@adresse.sn"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={{ marginTop: 0 }}
        />
        <Field
          label="Ton mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          /* L'échec porte sur le COUPLE, pas sur le mot de passe seul — mais il s'affiche
             ici, sous le dernier champ rempli, là où le regard se trouve déjà. */
          error={echec ?? undefined}
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
          label={enCours ? 'Connexion…' : 'Je me connecte'}
          disabled={!complet || enCours}
          style={{ marginTop: 17 }}
          onPress={() => { void seConnecter(); }}
        />
        <Button
          tone="quiet"
          label="Mot de passe oublié ?"
          style={{ marginTop: 10 }}
          onPress={() => router.push('/mot-de-passe')}
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Un seul compte, ici et sur le site</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          C'est le même compte que sur maxmorrys.me : les mêmes cours, la même progression,
          les mêmes certificats. Si tu t'es inscrit par Google sur le site, tu n'as pas encore
          de mot de passe — passe par « mot de passe oublié » pour t'en donner un.
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
