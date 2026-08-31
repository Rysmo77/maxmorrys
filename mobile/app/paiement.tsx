import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
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
      await WebBrowser.openAuthSessionAsync(`${PAY_ORIGIN}/checkout/${slug}?from=app`, 'rysmo://paiement/retour');
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
