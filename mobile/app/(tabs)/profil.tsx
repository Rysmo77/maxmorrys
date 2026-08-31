import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Display, Eyebrow, Icon, Mesh, Surface, TUTOR_DEFAUT, tutorNom, useScheme, useToken } from '../../ds';

/**
 * LE PROFIL — et le seul réglage que cet écran sait déjà tenir.
 *
 * LE THÈME N'EST PAS UN RÉGLAGE DE L'APPLICATION, et c'est délibéré. `useScheme()` lit
 * `useColorScheme()` de React Native, c'est-à-dire le réglage du TÉLÉPHONE. Une bascule
 * clair/sombre propre à l'application ajouterait un troisième état — « suit le système »,
 * « clair », « sombre » — à tenir en mémoire, en plus du réglage système qu'elle
 * contredirait. Cet écran affiche donc le mode courant plutôt que de le commander.
 *
 * LE NOM DU TUTEUR, LUI, EST BIEN UN RÉGLAGE DE PROFIL. Il est montré ici parce que c'est
 * l'endroit où on le cherche — et parce que la barre d'onglets l'affiche : quelqu'un qui
 * voit « Répétiteur » en bas de son écran doit pouvoir trouver où le changer.
 */
export default function Profil() {
  const t = useToken();
  const scheme = useScheme();
  const insets = useSafeAreaInsets();
  const [nom] = useState(tutorNom());

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="informe" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ton compte</Eyebrow>
        <Display lines={['Tes réglages.']} style={{ marginTop: 6 }} />

        <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
          <Eyebrow>Le nom de ton tuteur</Eyebrow>
          <Body style={{ marginTop: 6, fontWeight: '700' }}>{nom}</Body>
          <Body muted style={{ marginTop: 4 }}>
            {nom === TUTOR_DEFAUT
              ? "C'est le nom par défaut. Tu peux le changer : c'est celui qui s'affichera dans ta barre du bas."
              : "C'est le nom que tu lui as donné. Il s'affiche dans ta barre du bas."}
          </Body>
        </Surface>

        <Surface level="flat" style={{ marginTop: 14, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name={scheme === 'dark' ? 'eye' : 'globe'} size={20} color={t('ink2')} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>
                Affichage {scheme === 'dark' ? 'sombre' : 'clair'}
              </Body>
              <Body muted style={{ marginTop: 2 }}>
                Il suit le réglage de ton téléphone. L'application ne le contredit pas.
              </Body>
            </View>
          </View>
        </Surface>

        <Surface level="truth" style={{ marginTop: 14, padding: 18 }}>
          <Eyebrow>Ce que cet écran ne fait pas encore</Eyebrow>
          <Body muted style={{ marginTop: 6 }}>
            Ni connexion, ni changement de mot de passe, ni suppression de compte. Ce port
            natif rend la mise en page ; le compte reste celui du site, et c'est là qu'il se
            gère pour l'instant. Aucun de ces boutons n'est affiché en attendant — un bouton
            qui ne fait rien est pire que son absence.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
