import { useState } from 'react';
import { View } from 'react-native';
import {
  Body, Button, Display, Eyebrow, Field, Icon, Screen, Surface, isIOS, useToken, veil,
} from '../ds';

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
 * ⚠️ ET LE LIEN NE PART PAS. Le produit n'a AUCUN canal d'envoi d'e-mail. L'accusé de
 * réception le dit dans le même encart, sous la même bordure — pour qu'on ne puisse pas
 * lire l'un sans l'autre. La maquette pose ce constat aussi ; on ne l'a pas déplacé en note
 * de bas de page, où il se lit après avoir cru.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function MotDePasse() {
  const t = useToken();
  const [email, setEmail] = useState('');
  const [accuse, setAccuse] = useState(false);

  function accuseReception() {
    /*
      ── L'INVARIANT. NE PAS BRANCHER D'EMBRANCHEMENT ICI. ──
      Quand l'envoi existera, il vient à cette ligne et SON RÉSULTAT N'EST PAS LU :

          try { await envoyerLienDeReinitialisation(email.trim()); }
          catch { /* volontairement vide *\/ }
          finally { setAccuse(true); }

      Le `catch` vide n'est pas une négligence, c'est la mesure : distinguer « adresse
      inconnue » de « lien envoyé » rendrait cet écran capable de répondre « inscrit / pas
      inscrit » à qui lui soumet une liste d'adresses. Le seul état de sortie est celui-ci.
    */
    setAccuse(true);
  }

  return (
    <Screen territory="forme" retour="Connexion" titre={isIOS ? undefined : 'Mot de passe oublié'}>
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
            style={{ marginTop: 0 }}
          />
          <Button
            tone="forme"
            label="Envoie-moi le lien"
            // Le champ vide désactive le bouton — c'est une vérification de FORME, faite ici,
            // qui ne consulte rien et ne révèle donc rien. La seule frontière qu'on ne
            // franchit pas est celle qui dirait quelque chose sur le compte lui-même.
            disabled={!email.trim()}
            onPress={accuseReception}
            style={{ marginTop: 16 }}
          />
        </Surface>

        {accuse && (
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
                  <Body muted style={{ fontSize: 12 }}>
                    Ce lien dépend d'un canal d'envoi d'e-mail, qui n'existe pas encore dans le
                    produit. Rien n'est parti pour l'instant — et la phrase au-dessus reste
                    celle que tu liras quand il existera, mot pour mot.
                  </Body>
                </View>
              </View>
            </View>
          </Surface>
        )}

        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Pourquoi ce « si »</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Je ne te dirai jamais si une adresse a un compte ou non. Ça paraît moins
            serviable, mais ça évite qu'un inconnu puisse tester des adresses pour savoir qui
            est inscrit. Une adresse sans compte reçoit ici la même réponse, au mot près, que
            la tienne.
          </Body>
        </Surface>
    </Screen>
  );
}
