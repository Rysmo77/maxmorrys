import { Share, View } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, DocLine, Display, Eyebrow, Icon, IconButton, Num, PriceBlock, Screen,
  Surface, Tag, isIOS, useToken,
} from '../ds';
import { DEVIS, PACK, RELEVE, SOURCE } from '../contenu/reference';

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
export default function Devis() {
  const t = useToken();

  return (
    <Screen
      territory="digitalise"
      retour="Offre"
      titre={isIOS ? undefined : 'Ton devis'}
      droite={
        <IconButton
          label="Partager le devis"
          onPress={() => { void Share.share({ message: `Mon devis — ${PACK.nom}\n${DEVIS.lien}`, url: DEVIS.lien }); }}
        >
          <Icon name="share" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>Devis · consultable sans compte</Eyebrow>
      <Display size={27} lines={['TON DEVIS,', 'PACK VISIBLE.']} style={{ marginTop: 8 }} />
      <Num
        value={DEVIS.lien.replace('https://', '')}
        source={SOURCE}
        asOf={RELEVE}
        style={{ fontSize: 11.5, color: t('textFaint'), marginTop: 10 }}
      />

      <Surface level="flat" style={{ marginTop: 16, padding: 19 }}>
        {PACK.lignes.map((l, i) => (
          <DocLine key={l} label={l} value="incluse" last={i === PACK.lignes.length - 1} />
        ))}

        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <PriceBlock
            amount={PACK.prix}
            source={SOURCE}
            asOf={RELEVE}
            size={28}
            note="Une fois · promotion de lancement"
          />
          <Tag tone="ok">{DEVIS.validite}</Tag>
        </View>
        <Num
          value={`Émis le ${DEVIS.emisLe} · valable jusqu'au ${DEVIS.valideJusqu}`}
          source={SOURCE}
          asOf={RELEVE}
          style={{ fontSize: 11.5, color: t('textMuted'), marginTop: 10 }}
        />
      </Surface>

      <Button
        tone="digitalise"
        label="Continuer sur WhatsApp"
        style={{ marginTop: 18 }}
        onPress={() => { void openBrowserAsync('https://wa.me/221000000000'); }}
      />
      <Button
        tone="quiet"
        label="Partager le devis"
        icon="share"
        style={{ marginTop: 9 }}
        onPress={() => { void Share.share({ message: `Mon devis — ${PACK.nom}\n${DEVIS.lien}`, url: DEVIS.lien }); }}
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
