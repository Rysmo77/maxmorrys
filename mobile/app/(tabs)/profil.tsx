import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Body, Display, Eyebrow, Icon, LessonRow, Mesh, Surface, TUTOR_DEFAUT, useScheme, useToken, useTutorNom } from '../../ds';

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
/** Les écrans de compte, dans l'ordre où on les cherche. */
const COMPTE = [
  { href: '/preferences', glyphe: 'settings' as const, titre: 'Préférences', sous: 'le nom de ton tuteur, ce que je t\'envoie' },
  { href: '/connexion', glyphe: 'login' as const, titre: 'Connexion', sous: 'sur le site, avec la même session' },
  { href: '/mot-de-passe', glyphe: 'lock' as const, titre: 'Mot de passe oublié', sous: 'un lien de réinitialisation' },
  { href: '/suppression', glyphe: 'trash' as const, titre: 'Supprimer mon compte', sous: 'définitif, sans passer par le support' },
] as const;

export default function Profil() {
  const t = useToken();
  const scheme = useScheme();
  const insets = useSafeAreaInsets();
  /* `useTutorNom()` : le profil est l'endroit d'où on renomme, il doit voir le nouveau
     nom sans attendre un remontage. `useState(tutorNom())` figeait la valeur du premier
     rendu — donc l'ancien nom, juste après l'avoir changé. */
  const nom = useTutorNom();

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
            Le compte lui-même reste celui du site : la connexion et la suppression y sont
            traitées, parce que ce port n'embarque pas encore le SDK d'authentification. Les
            écrans ci-dessous rendent le geste et ouvrent le site au bon endroit — ils ne
            font pas semblant de le tenir ici.
          </Body>
        </Surface>

        {/*
          LES QUATRE ÉCRANS DE COMPTE. Ils existent, et sans cette liste ils n'auraient aucun
          point d'entrée : une route qu'aucun écran n'ouvre est du code mort, et sur un
          routeur par fichiers elle ne se voit pas manquer.
        */}
        <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 18 }}>
          {COMPTE.map((entree, i) => (
            <Link key={entree.href} href={entree.href as never} asChild>
              <LessonRow
                icon={<Icon name={entree.glyphe} size={14} color={t('ink2')} />}
                title={entree.titre}
                meta={entree.sous}
                trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
                last={i === COMPTE.length - 1}
              />
            </Link>
          ))}
        </Surface>
      </ScrollView>
    </View>
  );
}
