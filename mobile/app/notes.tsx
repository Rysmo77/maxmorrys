import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, ChipRow, Display, Eyebrow, Fab, Icon, IconButton, LessonRow, Num, Screen, Surface, Tag,
  isIOS, useToken,
} from '../ds';
import { FORMATION, NOTES, NOTES_TOTAL, RELEVE, SOURCE } from '../contenu/demo';

/**
 * ══ 5 · MES NOTES ══
 *
 * ELLES SURVIVENT À LA FIN DU COURS ET SUIVENT D'UN APPAREIL À L'AUTRE. C'est ce qui les
 * distingue d'un surlignage : une note prise pendant la leçon 5 sert encore six mois après,
 * quand la formation est finie et que la boutique existe.
 *
 * LE BOUTON D'AJOUT EST FLOTTANT, et c'est le SEUL écran du produit qui en a un — parce que
 * c'est le seul où l'action principale est « en créer une de plus », à n'importe quel endroit
 * de la liste. Sa forme change de plateforme (voir `ds/Fab.tsx`) : c'est la seule divergence
 * de DESSIN du portage.
 *
 * « TOI SEULE LES LIS » EST UNE ÉTIQUETTE, PAS UNE PROMESSE EN PETIT. Elle est à côté du
 * compte, à l'endroit où quelqu'un se demande si ce qu'il écrit va être vu.
 */
export default function Notes() {
  const t = useToken();

  /*
   * ⚠️ L'ÉCRITURE N'EST PAS BRANCHÉE : une note se range sur l'inscription, côté Firestore, et
   * le SDK n'est pas là. Le bouton existe quand même — c'est l'affordance qui décide de la
   * mise en page de tout l'écran. Il DIT ce qui manque au lieu de ne rien faire : un bouton
   * inerte se lit comme une panne, et une panne sans motif se signale au support.
   */
  function ecrire() {
    Alert.alert(
      'L’écriture arrive avec ton compte',
      "Une note se range sur ton inscription, pas sur ce téléphone — c'est ce qui lui permet de te suivre d'un appareil à l'autre. Tant que le compte n'est pas branché ici, elle s'écrit sur le site, dans la leçon.",
    );
  }

  return (
    <Screen
      territory="forme"
      tabbar
      retour="Leçon"
      titre={isIOS ? undefined : 'Mes notes'}
      droite={
        <IconButton label="Chercher dans mes notes">
          <Icon name="search" size={17} color={t('textBody')} strokeWidth={2.4} />
        </IconButton>
      }
      /*
        LE BOUTON FLOTTANT PASSE PAR `overlay`, PAS PAR LE CORPS. Dans le corps, il vivrait
        dans le conteneur défilant : il s'en irait vers le haut au premier glissement, sur
        l'écran même dont il est l'action principale.
      */
      overlay={(
        <Fab label="Écrire une note" territory="forme" onPress={ecrire}>
          <Icon name="plus" size={22} color={t('paperFixed')} strokeWidth={2.6} />
        </Fab>
      )}
    >
      <Eyebrow style={{ marginTop: 6 }}>{FORMATION?.moduleEnCours ?? 'Tes notes'}</Eyebrow>
      <Display size={27} lines={['Mes notes']} style={{ marginTop: 8 }} />

      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginTop: 10,
      }}>
        {/* Le compte, ou rien. « 0 notes » sans relevé se lirait comme une perte. */}
        <Num
          value={NOTES_TOTAL ? `${NOTES_TOTAL.notes} notes · ${NOTES_TOTAL.lecons} leçons` : null}
          source={SOURCE}
          asOf={RELEVE}
          fallback="compte non relevé"
          style={{ fontSize: 12, color: t('textMuted') }}
        />
        <Tag>Toi seule les lis</Tag>
      </View>

      <ChipRow
        options={['Vidéo', 'Transcription', 'Mes notes', 'Ressources']}
        value="Mes notes"
        onChange={(v) => { if (v !== 'Mes notes') router.back(); }}
        height={36}
        style={{ marginTop: 16 }}
      />

      <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
        {NOTES.map((n, i) => (
          <LessonRow
            key={n.texte}
            icon={<Icon name="comment" size={14} color={t('ink2')} />}
            title={n.texte}
            meta={n.date}
            trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
            last={i === NOTES.length - 1}
          />
        ))}
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Ce qu'elles deviennent</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrire une
          note rapporte de l'expérience ; la rééditer n'en rapporte pas.
        </Body>
      </Surface>

    </Screen>
  );
}
