import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Body, Display, Eyebrow, Mesh, Surface, useToken } from '../../ds';

/**
 * L'ACCUEIL. Les quatre territoires, empilés.
 *
 * Au web, quatre cartes s'emboîtent par un chevron et reconstruisent la silhouette du M du
 * logo en défilant — chevauchement de −14 px. Le natif garde l'empilement et le chevauchement ;
 * le chevron découpé demande un `clip-path`, qui n'existe pas ici, et se rendrait en SVG. Il
 * est laissé de côté pour l'instant plutôt que rendu à moitié.
 *
 * AUCUN CHIFFRE SUR CET ÉCRAN. Ni nombre d'inscrits, ni note, ni taux de réussite — ce sont
 * des interdits absolus, et la base de production les contredirait de toute façon. Ce qui les
 * remplace vit sur les écrans de vente : l'encart de vérité.
 */
const TERRITORIES = [
  { key: 'forme', verb: 'Je te forme', line: 'Des formations pratiques, une fois payées, à vie.', href: '/formations' },
  { key: 'informe', verb: "Je t'informe", line: 'Des articles que j\'écris et que je relis moi-même.', href: '/blog' },
  { key: 'transforme', verb: 'Je te transforme', line: 'Le podcast, les vidéos, et le Club des Digitos.', href: '/club' },
  { key: 'digitalise', verb: 'Je te digitalise', line: 'Ton commerce en ligne, monté et livré.', href: '/presence' },
] as const;

export default function Home() {
  const t = useToken();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Depuis Dakar</Eyebrow>

        {/*
          Le titre est ÉCRIT ligne par ligne, jamais replié tout seul. Le français court
          environ 18 % plus long : laissé libre, il passe à quatre lignes et perd sa masse.
        */}
        <View style={{ marginTop: 10, marginBottom: 26 }}>
          <Display size="md" lines={['JE TE FORME', 'AU DIGITAL.', 'DEPUIS DAKAR.']} />
        </View>

        <Body muted style={{ maxWidth: 320, marginBottom: 30 }}>
          Tu paies en Wave ou en Orange Money. Une fois, et tu gardes l'accès.
        </Body>

        {TERRITORIES.map((territory, i) => (
          <Link key={territory.key} href={territory.href as never} asChild>
            <Surface
              level="flat"
              style={{
                padding: 20,
                // Le chevauchement de l'empilement en M : −14 px, la valeur du kit.
                marginTop: i === 0 ? 0 : -14,
                borderLeftWidth: 3,
                borderLeftColor: t(`mm${territory.key === 'forme' ? 'Bleu' : territory.key === 'informe' ? 'Orange' : territory.key === 'transforme' ? 'Violet' : 'Teal'}` as never),
              }}
            >
              <Display size="xs">{territory.verb}</Display>
              <Body muted style={{ marginTop: 6 }}>{territory.line}</Body>
            </Surface>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
