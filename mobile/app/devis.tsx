import { useState } from 'react';
import { Share, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Body, Button, Display, Eyebrow, Icon, IconButton, Screen, Surface, isIOS, useToken } from '../ds';
import { FORME_REFERENCE, OFFRE, SITE_PUBLIC } from '../contenu/termes';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ LE DEVIS ══ — LA RÉFÉRENCE EST VRAIE, LE RESTE VIT SUR LE SITE.
 *
 * ⛔ AUCUNE VUE DU CONTRAT NE SERT UN DEVIS. Côté web, la page lit le document directement
 * dans la base (`getAgencyQuote`) ; l'application ne parle qu'au Worker, qui n'a pas de vue
 * `appDevis`. L'ancien écran affichait donc un devis de DÉMONSTRATION — lignes, montant, dates
 * — c'est-à-dire un document commercial inventé, montré à quelqu'un qui s'apprête à signer.
 *
 * Cet écran ne fabrique rien : il porte la RÉFÉRENCE — elle vient de la personne — et il ouvre
 * le document là où il est servi. (Approche de la réécriture Kotlin, reprise.)
 *
 * ── ⛔ DEUX PHRASES DU KIT NE SONT PAS VRAIES ────────────────────────────────────────────
 * 1 · L'ADRESSE `maxmorrys.me/devis/MM-D-4831` n'existe pas : le site sert
 *     `presence-digitale/devis/<référence>`, et une référence est `DV-` + douze hexadécimaux.
 * 2 · « FIGÉ À L'ÉMISSION ». La page web recalcule les totaux depuis la grille COURANTE à
 *     chaque ouverture. C'est la copie qui s'aligne sur le code : l'encart dit ce qui se passe.
 *
 * ⭐ CE QUI PART EST UN LIEN, JAMAIS UNE CAPTURE : le destinataire lit le devis à jour.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Devis() {
  const t = useToken();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const reference = (Array.isArray(ref) ? ref[0] : ref ?? '').trim().toUpperCase();
  const formeConnue = FORME_REFERENCE.test(reference);
  const adresse = `${SITE_PUBLIC}${OFFRE.cheminDevis}${reference}`;
  const [echec, setEchec] = useState(false);

  async function ouvrir() {
    try {
      setEchec(false);
      await openBrowserAsync(adresse);
    } catch {
      /* Aucun navigateur n'a répondu : l'adresse reste affichée, et elle vaut ailleurs. */
      setEchec(true);
    }
  }

  return (
    <Screen
      territory="digitalise"
      retour="Offre"
      titre={isIOS ? undefined : 'Ton devis'}
      droite={formeConnue ? (
        <IconButton
          label="Partager le devis"
          onPress={() => { void Share.share({ message: `Mon devis Présence Digitale : ${adresse}` }); }}
        >
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      ) : undefined}
    >
      <Eyebrow style={{ marginTop: 6 }}>Devis · consultable sans compte</Eyebrow>
      <Display size={27} lines={['TON DEVIS.']} style={{ marginTop: 8 }} />

      {formeConnue ? (
        <>
          <Surface level="flat" style={{ marginTop: 16, padding: 17 }}>
            <Eyebrow>Référence</Eyebrow>
            <Body style={{ marginTop: 6, fontFamily: 'JetBrainsMono', fontSize: 15 }}>{reference}</Body>
            <Body muted style={{ marginTop: 8, fontSize: 12, lineHeight: 18 }}>{adresse}</Body>
          </Surface>
          <Button tone="digitalise" label="Ouvrir le devis" style={{ marginTop: 18 }} onPress={() => { void ouvrir(); }} />
          {echec ? (
            <Body muted style={{ marginTop: 10, fontSize: 12.5, lineHeight: 19 }}>
              Aucun navigateur n'a pu ouvrir cette adresse. Elle reste valable ailleurs : recopie-la
              depuis un ordinateur.
            </Body>
          ) : null}
        </>
      ) : (
        /* « Cette référence n'a pas la bonne forme », « ce devis n'existe pas » et « la lecture
           n'a pas abouti » sont trois choses : les confondre ferait conclure à un document
           annulé là où il n'y a qu'une faute de frappe. Ici, seule la première se sait. */
        <Surface level="truth" style={{ marginTop: 18, padding: 16 }}>
          <Eyebrow>Cette référence n'a pas la forme attendue</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 13, lineHeight: 20 }}>
            Une référence de devis commence par DV- et compte douze caractères ensuite, chiffres
            et lettres de A à F. Elle est imprimée en haut du document.
          </Body>
        </Surface>
      )}

      <View style={{ marginTop: 16 }}>
        <Surface level="truth" style={{ padding: 15 }}>
          <Eyebrow>Ce que le document dit, et ce qu'il ne dit pas</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
            Le devis reste valable {OFFRE.validiteJours} jours. Ses montants sont ceux de la grille
            publiée au moment où tu l'ouvres, révisée le {OFFRE.reviseLe} — pas une copie figée.
            Il ne contient aucune donnée personnelle : tu peux le transférer sans y penser.
          </Body>
        </Surface>
      </View>
    </Screen>
  );
}
