import { useState } from 'react';
import { View } from 'react-native';
import {
  Body, Button, Display, Eyebrow, Field, Icon, Revele, Screen, Surface, haptique, isIOS, useBandeau, useToken, veil,
} from '../ds';
import { ErreurIdentite, reinitialiser } from '../donnees/identite';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * MOT DE PASSE OUBLIÉ — L'ÉCRAN OÙ LE CHEMIN D'ERREUR EST LE CHEMIN DU SUCCÈS.
 *
 * La maquette écrit « SI un compte existe à cette adresse, le lien y est déjà », et son
 * encart explique le « si » : « Je ne te dirai jamais si une adresse a un compte ou non. Ça
 * paraît moins serviable, mais ça évite qu'un inconnu puisse tester des adresses pour savoir
 * qui est inscrit. »
 *
 * Cette phrase ne vaut que si le CODE la tient. Une page qui écrit le « si » et qui affiche
 * ensuite « adresse inconnue » sur le chemin d'erreur sert elle-même l'énumération qu'elle
 * jure d'empêcher — et elle la sert mieux qu'un silence, puisqu'elle donne une réponse
 * franche à chaque essai.
 *
 * D'OÙ L'INVARIANT DE CE FICHIER : `accuseReception()` a UNE SEULE SORTIE. Il n'y a pas de
 * `if`, pas de second message, pas d'état d'erreur. Il ne peut pas y en avoir : le résultat
 * de l'envoi n'est pas lu.
 *
 * ✅ LE LIEN PART MAINTENANT. C'est Firebase Authentication qui l'envoie, depuis son propre
 * domaine — le produit n'a toujours pas de canal d'e-mail à lui, et il n'en a pas besoin
 * pour celui-ci. L'invariant, lui, n'a pas bougé d'une ligne : le résultat de l'envoi n'est
 * toujours pas lu, et l'écran sort au même endroit qu'avant.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function MotDePasse() {
  const t = useToken();
  const [email, setEmail] = useState('');
  const [accuse, setAccuse] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const { bandeau, montrer, effacer } = useBandeau();

  async function accuseReception() {
    /*
      ── L'INVARIANT, TENU : CET ÉCRAN NE DIT JAMAIS QUI EST INSCRIT. ──
      Distinguer « adresse inconnue » de « lien envoyé » permettrait de tester une liste
      d'adresses. `reinitialiser()` étouffe cette différence au plus près de sa source.

      ⚠️ MAIS UNE COUPURE N'EST PAS UNE RÉPONSE. Le `catch` vide affichait « C'est parti »
      même hors réseau : quelqu'un attendait un e-mail qui n'était jamais parti. Le seul
      échec que `reinitialiser()` laisse remonter est le TRANSPORT — le dire ne révèle rien
      du compte, puisque rien n'a atteint le serveur.
    */
    if (envoi) return;
    setEnvoi(true);
    effacer();
    try {
      await reinitialiser(email);
      haptique.succes();
      setAccuse(true);
    } catch (erreur: unknown) {
      setAccuse(false);
      montrer('stop', "Rien n'est parti", erreur instanceof ErreurIdentite
        ? 'Pas de connexion. Réessaie quand le réseau revient : ton adresse est encore dans le champ.'
        : 'Réessaie dans un moment.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Screen territory="forme" espace="hub" retour="Retour" titre={isIOS ? undefined : 'Mot de passe oublié'}>
        <Eyebrow>Ton compte</Eyebrow>
        <View style={{ marginTop: 10 }}>
          <Display size="sm" lines={['On te remet', 'dedans.']} />
        </View>
        <Body muted style={{ marginTop: 12 }}>
          Donne ton e-mail : le lien de réinitialisation vaut une heure.
        </Body>

        <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
          <Field
            label="Ton e-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="ton@adresse.sn"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={() => { if (email.trim()) void accuseReception(); }}
            style={{ marginTop: 0 }}
          />
          <Button
            tone="forme"
            label={envoi ? 'Envoi…' : accuse ? 'Renvoyer le lien' : 'Envoie-moi le lien'}
            // Le champ vide désactive le bouton — c'est une vérification de FORME, faite ici,
            // qui ne consulte rien et ne révèle donc rien. La seule frontière qu'on ne
            // franchit pas est celle qui dirait quelque chose sur le compte lui-même.
            disabled={!email.trim() || envoi}
            onPress={() => { void accuseReception(); }}
            style={{ marginTop: 16 }}
          />
        </Surface>
        {bandeau}

        {accuse && (
          <Revele echelle>
          <Surface level="flat" style={{ marginTop: 16, padding: 18, borderColor: t('ok') }}>
            <View style={{ flexDirection: 'row', gap: 11 }}>
              <View style={{
                width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
                /* Un VOILE de l'encre verte, pas l'encre pleine : en nuit `ok` devient
                   #4ADE9B, et une coche blanche dessus tombe à 1,6:1. Le voile suit son
                   encre, la coche garde la sienne — c'est le motif de `LessonRow`. */
                backgroundColor: veil(t('ok'), 0.16),
              }}>
                <Icon name="check" size={15} color={t('ok')} strokeWidth={3.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '700', fontSize: 14.5, color: t('ok') }}>C'est parti</Body>
                <Body muted style={{ marginTop: 3, fontSize: 13 }}>
                  Si un compte existe à cette adresse, le lien y est déjà. Vérifie aussi tes
                  indésirables.
                </Body>

                {/*
                  SOUS LA MÊME BORDURE, ET PAS EN NOTE DE BAS DE PAGE. Un accusé de réception
                  qu'il faut faire défiler pour découvrir qu'il ne s'est rien passé est un
                  accusé de réception qui ment le temps d'un écran.
                */}
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t('borderHair') }}>
                  <Body muted style={{ fontSize: 12.5 }}>
                    Le message vient d'une adresse « noreply » — cherche-la si tu ne le trouves
                    pas. Et si cette adresse n'a pas de compte, tu lis exactement la même phrase.
                  </Body>
                </View>
              </View>
            </View>
          </Surface>
          </Revele>
        )}

        <Body muted style={{ marginTop: 16, fontSize: 12.5, lineHeight: 19 }}>
          Je ne dis jamais si une adresse a un compte : ça évite qu'un inconnu teste des
          adresses pour savoir qui est inscrit.
        </Body>
    </Screen>
  );
}
