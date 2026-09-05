import { Share, View } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, Display, DocLine, Eyebrow, Icon, IconButton, Num, PriceBlock, SansDonnees, Screen, Surface, Tag, isIOS, useToken,
} from '../ds';
import { DEVIS, RELEVE, SOURCE } from '../contenu/demo';
import { PACK_PRESENCE, PRESENCE_ARRETEE, PRESENCE_SOURCE } from '../contenu/engagement';

/**
 * ══ 5 · LE DEVIS PARTAGEABLE ══
 *
 * **CONSULTABLE SANS COMPTE, ET FIGÉ À L'ÉMISSION.** Les deux vont ensemble : un document
 * qu'on peut montrer à son associé sans lui faire créer un compte, et dont le contenu ne
 * change pas dans son dos. Une évolution de la grille ne réécrit pas un devis déjà envoyé —
 * sinon le prix qu'on a montré hier n'est plus celui qu'on lit aujourd'hui.
 *
 * **AUCUNE DONNÉE PERSONNELLE.** C'est ce qui permet de le partager sans réfléchir : il n'y a
 * rien dedans qui appartienne à quelqu'un.
 *
 * EN NATIF, LE PARTAGE PASSE PAR LA FEUILLE SYSTÈME — donc un bouton au lieu de deux, comme
 * pour le certificat, et « copier le lien » est une cible de la feuille, pas une ligne de plus.
 */
/*
 * ⚠️ CE BOUTON POINTAIT SUR UN NUMÉRO DE REMPLACEMENT — un `wa.me` suivi de neuf zéros. Un
 * appel à l'action principal qui ouvre un lien mort est un rejet en revue (2.1), et c'est le
 * genre de défaut qui survit longtemps parce qu'il a l'air d'une vraie URL.
 *
 * Il ouvre maintenant la page de contact du site, qui existe et répond. Le libellé a suivi :
 * annoncer WhatsApp pour ouvrir autre chose serait un second mensonge posé sur le premier.
 * Le jour où le vrai numéro est connu, il remplace cette constante et le libellé revient.
 */
const CONTACT = 'https://maxmorrys.me/contact';

export default function Devis() {
  const t = useToken();

  /* La garde vient AVANT tout usage, y compris dans les props de la barre haute : un bouton
     de partage qui compose son message à partir d'un devis absent partagerait « undefined ». */
  if (DEVIS === null) {
    return (
      <Screen territory="digitalise" retour="Offre" titre={isIOS ? undefined : 'Ton devis'}>
        <Display size={27} lines={['Aucun devis', 'à afficher.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="ce devis"
          origine="du serveur qui l'a émis"
          degat="Un devis est un document opposable : son contenu est figé à l'émission, et son montant engage. En fabriquer un ici produirait un prix que personne n'a chiffré."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement de type ne survit pas à une closure quand la liaison vient d'un
     autre module : `onPress={() => X.y}` reperd le `non null` que la garde vient
     d'établir. Une constante LOCALE le porte jusque dans les rappels. */
  const devis = DEVIS;
  const pack = PACK_PRESENCE;
  return (
    <Screen
      territory="digitalise"
      retour="Offre"
      titre={isIOS ? undefined : 'Ton devis'}
      droite={
        <IconButton
          label="Partager le devis"
          onPress={() => { void Share.share({ message: `Mon devis — ${pack.nom}\n${devis.lien}`, url: devis.lien }); }}
        >
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>Devis · consultable sans compte</Eyebrow>
      <Display size={27} lines={['TON devis,', 'pack VISIBLE.']} style={{ marginTop: 8 }} />
      <Num
        value={devis.lien.replace('https://', '')}
        source={SOURCE}
        asOf={RELEVE}
        style={{ fontSize: 11.5, color: t('textFaint'), marginTop: 10 }}
      />

      <Surface level="flat" style={{ marginTop: 16, padding: 19 }}>
        {pack.lignes.map((l, i) => (
          <DocLine key={l} label={l} value="incluse" last={i === pack.lignes.length - 1} />
        ))}

        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <PriceBlock
            amount={pack.prix}
            source={PRESENCE_SOURCE}
            asOf={PRESENCE_ARRETEE}
            size={28}
            note="Une fois · promotion de lancement"
          />
          <Tag tone="ok">{devis.validite}</Tag>
        </View>
        <Num
          value={`Émis le ${devis.emisLe} · valable jusqu'au ${devis.valideJusqu}`}
          source={SOURCE}
          asOf={RELEVE}
          style={{ fontSize: 11.5, color: t('textMuted'), marginTop: 10 }}
        />
      </Surface>

      <Button
        tone="digitalise"
        label="Nous écrire"
        style={{ marginTop: 18 }}
        onPress={() => { void openBrowserAsync(CONTACT); }}
      />
      <Button
        tone="quiet"
        label="Partager le devis"
        icon="share"
        style={{ marginTop: 9 }}
        onPress={() => { void Share.share({ message: `Mon devis — ${pack.nom}\n${devis.lien}`, url: devis.lien }); }}
      />

      <Surface level="truth" style={{ marginTop: 18, padding: 15 }}>
        <Eyebrow>Ce que ce document contient, et ne contient pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Aucune donnée personnelle. Son contenu est{' '}
          <Body style={{ fontWeight: '700', fontSize: 12.5 }}>figé à l'émission</Body> : une
          évolution de la grille ne réécrit pas un devis déjà envoyé.
        </Body>
      </Surface>
    </Screen>
  );
}
