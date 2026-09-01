import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Body, Display, Eyebrow, Icon, LessonRow, Mesh, Surface, useToken } from '../../ds';

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
/**
 * ── LES QUATRE TERRITOIRES, ET OÙ ILS MÈNENT VRAIMENT ───────────────────────────────────
 *
 * Trois des quatre cartes pointaient sur des routes qui N'EXISTENT PAS dans ce port :
 * `/formations`, `/blog` et `/presence`. Un lien profond vers une route absente ne rend pas
 * une page vide — expo-router ne trouve rien et l'écran d'accueil devient un cul-de-sac.
 * C'est le premier écran de l'application.
 *
 * Deux territoires ont un écran natif — le catalogue et le Club. Les deux autres n'en ont
 * pas, et n'en auront pas tant que le blog et l'offre TPE ne seront pas portés : ils ouvrent
 * donc le WEB dans le navigateur système, ce qui est déjà le motif retenu partout ailleurs
 * ici pour un parcours non porté (AD-11 le pose pour le paiement, pour la même raison — ne
 * pas faire semblant d'avoir ce qu'on n'a pas).
 *
 * La carte le DIT : « sur le site » plutôt qu'un libellé identique aux deux autres. Une
 * sortie hors de l'application n'a pas à se déguiser en navigation interne.
 */
const SITE = 'https://maxmorrys.me';

const TERRITORIES = [
  { key: 'forme', verb: 'Je te forme', line: 'Des formations pratiques, une fois payées, à vie.', href: '/catalogue', web: null },
  { key: 'informe', verb: "Je t'informe", line: 'Des articles que j\'écris et que je relis moi-même.', href: null, web: `${SITE}/blog` },
  { key: 'transforme', verb: 'Je te transforme', line: 'Le podcast, les vidéos, et le Club des Digitos.', href: '/media', web: null },
  { key: 'digitalise', verb: 'Je te digitalise', line: 'Ton commerce en ligne, monté et livré.', href: null, web: `${SITE}/presence-digitale` },
] as const;

/** Les entrées de « Dans ton espace ». Le kit en pose deux ; le port en a trois à offrir. */
const ESPACE = [
  { href: '/notes', glyphe: 'comment' as const, titre: 'Mes notes', sous: 'toi seule les lis' },
  { href: '/certificat', glyphe: 'star' as const, titre: 'Mon certificat', sous: 'vérifiable par son code' },
  { href: '/hors-connexion', glyphe: 'download' as const, titre: 'Gardé hors connexion', sous: 'et le poids de chaque leçon' },
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

        {TERRITORIES.map((territory, i) => {
          const carte = (
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
              {territory.web ? (
                <Eyebrow style={{ marginTop: 10 }}>Sur le site</Eyebrow>
              ) : null}
            </Surface>
          );

          if (territory.href) {
            return (
              <Link key={territory.key} href={territory.href as never} asChild>
                {carte}
              </Link>
            );
          }
          return (
            <Pressable key={territory.key} onPress={() => { void openBrowserAsync(territory.web); }}>
              {carte}
            </Pressable>
          );
        })}

        {/*
          « DANS TON ESPACE » — la liste que le kit pose sous les territoires
          (`screens-space.jsx` § Espace). Sans elle, trois écrans natifs existants n'ont
          aucun point d'entrée : les notes, le certificat, et la bibliothèque hors connexion.
          Une route qu'aucun écran n'ouvre est du code mort, et sur un routeur par fichiers
          elle ne se voit pas manquer.
        */}
        <Eyebrow style={{ marginTop: 28 }}>Dans ton espace</Eyebrow>
        <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18 }}>
          {ESPACE.map((entree, i) => (
            <Link key={entree.href} href={entree.href as never} asChild>
              <LessonRow
                icon={<Icon name={entree.glyphe} size={14} color={t('ink2')} />}
                title={entree.titre}
                meta={entree.sous}
                trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
                last={i === ESPACE.length - 1}
              />
            </Link>
          ))}
        </Surface>
      </ScrollView>
    </View>
  );
}
