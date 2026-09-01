import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Body, Button, Display, Eyebrow, Mesh, Num, Surface, useToken } from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE PAIEMENT NE SE FAIT PAS DANS L'APPLICATION.  (AD-11)
 *
 * C'est la décision qui a failli empêcher cette application d'exister, et elle mérite d'être
 * comprise plutôt que subie.
 *
 * Apple et Google prélèvent 15 à 30 % sur tout achat de contenu numérique fait dans
 * l'application — en carte, sans Wave ni Orange Money. Sur une formation à 95 000 FCFA, c'est
 * 14 250 à 28 500 F par vente. Et surtout : le paiement en monnaie électronique locale, qui
 * est le seul vrai avantage du produit sur son marché, disparaîtrait de l'écran d'achat.
 *
 * Cet écran s'arrête donc à la SÉLECTION du moyen, et passe la main au navigateur système.
 * Le montant débité reste celui recalculé côté serveur, jamais celui transmis par le client :
 * un prix affiché est un affichage, un prix débité est une décision serveur.
 *
 * ⚠️ HYPOTHÈSE NON LEVÉE : que la revue Apple accepte ce renvoi au titre de la ligne 3.1.1.
 *    Non vérifié. À trancher avant toute soumission. Repli connu : retirer tout achat de
 *    l'application native et la cantonner à la consultation.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
const PAY_ORIGIN = 'https://maxmorrys.me';
/* L'URL de retour du navigateur. Elle DOIT correspondre au `scheme` d'`app.json` —
   sinon la session ne se referme jamais et l'écran reste bloqué sur le navigateur. */
const RETOUR = 'rysmo://paiement/retour';

export default function Paiement() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { slug, titre, prix } = useLocalSearchParams<{ slug?: string; titre?: string; prix?: string }>();
  const [opening, setOpening] = useState(false);

  // Le prix vient du paramètre de route, donc du serveur qui a rendu l'écran précédent.
  // `null` s'il manque : <Num> affichera « non relevé » plutôt qu'un zéro qui serait faux.
  const amount = prix ? Number(prix) : null;

  async function openCheckout() {
    if (!slug) return;
    setOpening(true);
    try {
      // `openAuthSessionAsync` et non `openBrowserAsync` : la session partage les cookies du
      // site, donc quelqu'un déjà connecté sur le web ne se reconnecte pas pour payer.
      const issue = await WebBrowser.openAuthSessionAsync(`${PAY_ORIGIN}/checkout/${slug}?from=app`, RETOUR);

      /*
        ── LE RETOUR N'AVAIT AUCUN DESTINATAIRE ─────────────────────────────────────────
        Le tunnel ouvrait le navigateur avec `rysmo://paiement/retour` comme URL de retour,
        et personne ne rattrapait ce retour : `/paiement/retour` n'est pas une route de ce
        routeur, et le résultat de la session était jeté. Quelqu'un qui venait de valider
        dans Wave revenait donc sur l'écran de paiement — le même —, sans savoir si sa
        transaction était passée. C'est le point du parcours où se perd le plus de monde.

        LES TROIS ISSUES SONT TRAITÉES, ET AUCUNE N'EST DEVINÉE :
        · `success` — le web renvoie son verdict dans l'URL. On le LIT ; un statut absent ou
          inconnu mène à l'attente, jamais au succès.
        · `dismiss` / `cancel` — la personne a fermé le navigateur. On ne sait RIEN de la
          transaction : c'est exactement l'attente, et la maquette l'écrit — « tu peux aussi
          fermer et revenir plus tard, ta commande reste ouverte ».

        Le montant qui fait foi reste celui recalculé côté serveur. Rien ici ne le décide.
      */
      if (issue.type === 'success') {
        const params = new URL(issue.url).searchParams;
        const statut = params.get('status');
        const reference = params.get('transactionId') ?? params.get('reference') ?? undefined;
        const route = statut === 'completed' ? '/succes' : statut === 'failed' ? '/echec' : '/attente';
        router.replace({ pathname: route, params: { reference, titre, montant: prix, slug } });
      } else {
        router.replace({ pathname: '/attente', params: { titre, montant: prix, slug } });
      }
    } catch {
      // Le motif réel, la conséquence, la sortie — dans cet ordre. Jamais d'excuse.
      Alert.alert(
        "Le navigateur n'a pas pu s'ouvrir",
        `Ouvre ${PAY_ORIGIN}/checkout/${slug} depuis ton navigateur pour finir le paiement. Ton panier t'y attend.`,
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}>
        <Eyebrow>Paiement</Eyebrow>
        <View style={{ marginTop: 10, marginBottom: 22 }}>
          <Display size="sm">{titre ?? 'Ta formation'}</Display>
        </View>

        <Surface level="hero" style={{ padding: 22 }}>
          <Body muted>Une fois, accès à vie.</Body>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'baseline' }}>
            <Num
              value={amount}
              source="server"
              asOf={new Date()}
              unit="FCFA"
              style={{ fontSize: 31 }}
              fallback="prix non transmis"
            />
          </View>

          {/*
            L'ENCART DE VÉRITÉ, à la place de la preuve sociale. Il n'est pas décoratif : sans
            note ni nombre d'inscrits à afficher, ce qui rend la page crédible est de DIRE
            pourquoi ils manquent, plutôt que de laisser un vide que le visiteur interprète.
          */}
          <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: t('borderHair') }}>
            <Eyebrow>Ce que je n'affiche pas</Eyebrow>
            <Body muted style={{ marginTop: 6 }}>
              Ni note, ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien
              d'honnête à en dire.
            </Body>
          </View>
        </Surface>

        <View style={{ marginTop: 22 }}>
          <Button
            tone="forme"
            label={opening ? 'Ouverture…' : 'Payer en Wave ou Orange Money'}
            disabled={opening || !slug}
            onPress={() => void openCheckout()}
          />
          {/*
            On DIT ce qui va se passer avant que ça se passe. Un navigateur qui s'ouvre sans
            prévenir se lit comme une sortie d'application non voulue — et quelqu'un qui doute
            au moment de payer ne paie pas.
          */}
          <Body muted style={{ marginTop: 12, fontSize: 13 }}>
            Le paiement s'ouvre dans ton navigateur : c'est le seul moyen de te laisser payer en
            Wave et en Orange Money. Tu reviens ici tout de suite après.
          </Body>
        </View>
      </ScrollView>
    </View>
  );
}
