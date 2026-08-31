import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Display, Eyebrow, Icon, Mesh, Surface, tutorNom, useToken } from '../../ds';

/**
 * LE TUTEUR — et son nom n'est pas le nôtre.
 *
 * Cet onglet s'appelle « Répétiteur » par défaut, et porte le nom que la personne lui a
 * donné dès qu'elle en a choisi un. Le titre de l'écran le reprend donc de `tutorNom()`,
 * comme la barre : deux endroits qui écriraient le même nom séparément finiraient par ne
 * plus l'écrire pareil.
 *
 * ⚠️ « Rysmo » N'EST PAS SON NOM. C'est le nom de cette application. Les confondre dans un
 * libellé rendrait le renommage par personne inintelligible — la personne aurait renommé son
 * tuteur et lirait encore le nom du produit.
 */
export default function Repetiteur() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const nom = tutorNom();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ton tuteur</Eyebrow>
        <Display lines={[`${nom},`, 'quand tu bloques.']} style={{ marginTop: 6 }} />
        <Body muted style={{ marginTop: 12 }}>
          Il répond sur ce que tu es en train d'apprendre, pas sur tout. Tu peux le renommer :
          c'est ton répétiteur, il porte le nom que tu lui donnes.
        </Body>

        <Surface level="flat" style={{ marginTop: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="chat" size={20} color={t('ink2')} />
            <Body style={{ flex: 1, fontWeight: '700' }}>La conversation n'est pas encore branchée</Body>
          </View>
          <Body muted style={{ marginTop: 8 }}>
            Le tuteur tourne sur le site ; ce port natif rend sa place, pas encore ses
            réponses. Aucun échange n'est simulé ici — une réponse fabriquée serait une
            réponse à laquelle tu ferais confiance.
          </Body>
        </Surface>

        <Surface level="truth" style={{ marginTop: 14, padding: 18 }}>
          <Eyebrow>Ce qu'il ne fait pas</Eyebrow>
          <Body muted style={{ marginTop: 6 }}>
            Il ne corrige pas tes devoirs à ta place et ne remplace pas la leçon. Quand il ne
            sait pas, il le dit — c'est la seule façon de pouvoir le croire quand il sait.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
