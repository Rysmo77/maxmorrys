import { Alert, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Gradient, Icon, LessonRow, Num, SansDonnees, Screen, Surface, useToken, veil,
} from '../ds';
import { CERTIFICAT, RELEVE, SITE, SOURCE } from '../contenu/demo';

/**
 * ══ 8 · PARTAGE SYSTÈME ══
 *
 * CE QUI PART EST LE LIEN DE VÉRIFICATION, PAS UNE IMAGE. Une capture d'écran ne se vérifie
 * pas : elle se retouche en trente secondes. La page de vérification, elle, répond à un code,
 * sans compte, et ne remonte à aucun profil — c'est ce qui fait qu'un employeur peut la
 * contrôler lui-même.
 *
 * ── POURQUOI CET ÉCRAN EXISTE, ALORS QUE L'OS A DÉJÀ UNE FEUILLE ──────────────────────────
 * Le transfert dessine la feuille système au complet : LinkedIn, WhatsApp, e-mail. Ces cibles
 * sont celles du TÉLÉPHONE — l'OS les compose, et les redessiner reviendrait à afficher une
 * liste d'applications que la personne n'a peut-être pas installées.
 *
 * Ce que la feuille système NE SAIT PAS dire, en revanche, c'est ce qui part et pourquoi. Cet
 * écran porte donc les deux choses qui nous appartiennent — l'objet partagé, nommé, et la
 * raison — puis passe la main à la vraie feuille. « Copier » n'y est pas dupliqué : c'est une
 * cible de la feuille système, sur les deux plateformes.
 */
export default function Partage() {
  const t = useToken();

  /* ⚠️ CET ÉCRAN NE RECEVAIT AUCUN PARAMÈTRE, et ses deux appelants ne lui en passaient pas.
     Il retombait donc sur la démonstration — c'est-à-dire, en production, sur rien : « Rien à
     partager » juste après avoir ouvert le certificat qu'on voulait partager.

     Les paramètres viennent maintenant de la route, comme sur `/certificat`, et pour la même
     raison : quatre champs solidaires. Le lien de vérification se compose du CODE, et un code
     manquant produirait une adresse qui ne vérifie rien. */
  const p = useLocalSearchParams<{
    code?: string; titulaire?: string; formation?: string; emisLe?: string;
  }>();

  const recu = (p.code && p.formation)
    ? { code: p.code, formation: p.formation, lien: `${SITE}/verifier/${p.code}` }
    : null;
  const certificat = recu ?? (CERTIFICAT === null ? null : {
    code: CERTIFICAT.code,
    formation: CERTIFICAT.formation,
    lien: CERTIFICAT.lien,
  });

  /* La garde vient AVANT la fonction qui compose le message : un partage bâti sur un
     certificat absent enverrait « undefined » à un employeur. */
  if (certificat === null) {
    return (
      <Screen territory="forme" retour="Certificat" titre="Partager">
        <Display size={27} lines={['Rien à partager', "pour l’instant."]} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="le lien de vérification"
          origine="du certificat lui-même"
          degat="Ce qui part d'ici est un lien qu'un employeur ouvrira. Le fabriquer produirait une adresse qui ne vérifie rien."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  /* Le rétrécissement ne survit pas aux closures : `partager()`, l'alerte et les deux
     ouvertures de navigateur reperdraient le non-null que la garde vient d'établir. */
  const doc = certificat;

  async function ouvrirLaFeuille() {
    try {
      await Share.share({
        message: `Mon certificat — ${doc.formation}\n${doc.lien}`,
        url: doc.lien,
        title: 'Certificat de fin de formation',
      });
    } catch {
      /* Le motif, la conséquence, la sortie — dans cet ordre, et jamais d'excuse. */
      Alert.alert(
        "Le partage n'a pas pu s'ouvrir",
        `Ton certificat n'est pas touché. Son lien de vérification est ${doc.lien} — il s'ouvre depuis n'importe quel navigateur, sans compte.`,
      );
    }
  }

  if (certificat === null) {
    return (
      <Screen territory="forme" retour="Certificat" titre="Partager">
        <Display size={27} lines={['Rien à partager', 'pour l’instant.']} style={{ marginTop: 10 }} />
        <SansDonnees
          quoi="le lien de vérification"
          origine="du certificat lui-même"
          degat="Ce qui part d'ici est un lien qu'un employeur ouvrira. Le fabriquer produirait une adresse qui ne vérifie rien."
          style={{ marginTop: 20 }}
        />
      </Screen>
    );
  }

  return (
    <Screen territory="forme" retour="Certificat" titre="Partager">
      <Eyebrow style={{ marginTop: 6 }}>Ce qui va partir</Eyebrow>
      <Display size={27} lines={['UN LIEN,', 'PAS UNE IMAGE.']} style={{ marginTop: 8 }} />

      <Surface level="hero" style={{ marginTop: 18, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Gradient
            colors={[t('mmBleu'), t('mmTeal')]}
            radius={12}
            style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="doc" size={20} color={t('paperFixed')} />
          </Gradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Body style={{ fontSize: 14, fontWeight: '600' }}>
              Certificat · {doc.formation}
            </Body>
            <Num
              value={doc.lien.replace('https://', '')}
              source={SOURCE}
              asOf={RELEVE}
              style={{ fontSize: 11, color: t('textMuted') }}
            />
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 16 }} />

        <Button
          tone="forme"
          label="Ouvrir le partage"
          icon="share"
          onPress={() => void ouvrirLaFeuille()}
        />
        <Body muted style={{ fontSize: 11.5, textAlign: 'center', marginTop: 10, color: t('textFaint') }}>
          La liste des applications est celle de ton téléphone. « Copier le lien » y figure.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="download" size={15} color={t('ink2')} />}
          title="Enregistrer le PDF"
          meta="il se fabrique sur le site, à la demande"
          trailing={<Icon name="external" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => { void openBrowserAsync(`${doc.lien}.pdf`); }}
        />
        <LessonRow
          icon={<Icon name="eye" size={15} color={t('ink2')} />}
          iconBackground={veil(t('mmBleu'), 0.12)}
          title="Voir ce que verra la personne"
          meta="la page publique, sans compte"
          trailing={<Icon name="external" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => { void openBrowserAsync(doc.lien); }}
          last
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Pourquoi un lien et pas une image</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Une capture d'écran ne se vérifie pas. La page répond à un code, sans compte, et ne
          remonte à aucun profil : c'est ce qui permet à quelqu'un de contrôler ton certificat
          sans rien te demander — et à toi de le montrer sans ouvrir ton compte.
        </Body>
      </Surface>

      <Button
        tone="quiet"
        label="Revenir au certificat"
        style={{ marginTop: 14 }}
        onPress={() => router.back()}
      />
    </Screen>
  );
}
