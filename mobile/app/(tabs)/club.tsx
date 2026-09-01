import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Body, Display, Eyebrow, Icon, LessonRow, Mesh, Surface, type IconName, useToken,
} from '../../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE CLUB DES DIGITOS — L'INDEX DE SES HUIT ONGLETS.
 *
 * Le kit désigne huit onglets, et cet écran est leur porte. Il n'en est pas un neuvième :
 * il ne porte aucun contenu propre, seulement le chemin vers chacun et les deux choses
 * qu'on doit lire AVANT d'y entrer.
 *
 * DEUX RÈGLES DU SYSTÈME SE CROISENT ICI, ET AUCUNE N'EST DÉCORATIVE :
 *
 *   • AUCUN EMOJI. Le Club en porte pourtant en base — `MOOD_OPTIONS`, `CLUB_CATEGORIES.emoji`
 *     côté web — parce que ce sont des DONNÉES écrites sur des enregistrements réels, pas des
 *     ornements de mise en page. La règle porte sur ce qu'on REND, pas sur ce qu'on stocke :
 *     à l'écran, un glyphe du jeu ou une étiquette.
 *   • AUCUN NOMBRE DE MEMBRES. « Nous sommes déjà 1 200 » est l'un des six interdits absolus,
 *     et c'est exactement le chiffre qu'une page de club a envie d'écrire. Il n'y en a donc
 *     pas — ni ici, ni sur les huit onglets, tant qu'il ne vient pas d'un relevé daté. Le
 *     Club est du payant fermé : ce qu'on annonce avant de payer se vérifie à l'écran
 *     suivant, et un nombre de membres est ce qui se vérifie le plus vite.
 *
 * AUCUN ONGLET N'EST DÉSACTIVÉ. Chacun s'ouvre et dit lui-même ce qui n'est pas branché
 * chez lui — c'est plus honnête qu'une porte grisée qui ne dit pas pourquoi.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const ONGLETS: Array<{ href: string; icon: IconName; titre: string; ligne: string }> = [
  { href: '/club/fil', icon: 'comment', titre: 'Le fil', ligne: "Ce qui se passe cette semaine, et ton échéance en tête." },
  { href: '/club/discussions', icon: 'chat', titre: 'Discussions', ligne: 'La question bête se pose ici, par catégorie.' },
  { href: '/club/agenda', icon: 'calendar', titre: 'Agenda', ligne: 'Sessions en ligne, ateliers à Dakar.' },
  { href: '/club/membre', icon: 'user', titre: 'Membre', ligne: 'La fiche de quelqu\'un, et le signalement.' },
  { href: '/club/classement', icon: 'medal', titre: 'Classement', ligne: "Par vague d'arrivée, jamais absolu." },
  { href: '/club/opportunites', icon: 'case', titre: 'Opportunités', ligne: "Missions et appels d'offres, budget annoncé." },
  { href: '/club/parrainage', icon: 'gift', titre: 'Parrainage', ligne: 'La remise va au filleul, pas à toi.' },
  { href: '/club/infos', icon: 'info', titre: 'Infos', ligne: "Ce qui est garanti, et ce qui ne l'est pas." },
];

export default function Club() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Le Club des Digitos</Eyebrow>
        <Display lines={['Entre gens', 'qui vendent.']} style={{ marginTop: 6 }} />
        <Body muted style={{ marginTop: 12 }}>
          Des commerçants et des indépendants qui montrent ce qu'ils essaient, ce qui marche
          et ce qui rate. Pas un fil d'actualité : un endroit où poser une question précise et
          recevoir une réponse de quelqu'un qui l'a déjà faite.
        </Body>

        <Eyebrow style={{ marginTop: 24 }}>Huit onglets</Eyebrow>
        <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18 }}>
          {ONGLETS.map((o, i) => (
            <LessonRow
              key={o.href}
              icon={<Icon name={o.icon} size={15} color={t('mmVioletT')} />}
              title={o.titre}
              /* `meta` est une fente MONOSPACE — durée, compte, date. Une phrase n'y va pas :
                 la monospace est réservée aux nombres vérifiables. D'où un nœud, pas une chaîne. */
              meta={<Body muted style={{ fontSize: 12.5, lineHeight: 17 }}>{o.ligne}</Body>}
              trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
              onPress={() => router.push(o.href)}
              last={i === ONGLETS.length - 1}
            />
          ))}
        </Surface>

        <Surface level="flat" style={{ marginTop: 14, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="users" size={20} color={t('ink2')} />
            <Body style={{ flex: 1, fontWeight: '700' }}>Les listes ne sont pas encore branchées</Body>
          </View>
          <Body muted style={{ marginTop: 8 }}>
            Ce port natif rend les huit onglets, pas encore leurs publications, leurs sessions
            ni leurs annonces. Rien n'est simulé : un message inventé dans ce fil serait
            attribué à quelqu'un. Chaque onglet le dit chez lui, précisément.
          </Body>
        </Surface>

        <Surface level="truth" style={{ marginTop: 14, padding: 18 }}>
          <Eyebrow>Ce que l'abonnement ne garantit pas</Eyebrow>
          <Body muted style={{ marginTop: 6 }}>
            Ni des clients, ni un revenu. Il donne l'accès au groupe, aux sessions et aux
            réponses — le reste dépend de ce que tu y mets. C'est écrit ici pour que tu n'aies
            pas à le découvrir après avoir payé.
          </Body>
        </Surface>

        <Surface level="truth" style={{ marginTop: 12, padding: 18 }}>
          <Eyebrow>Et pas de nombre de membres</Eyebrow>
          <Body muted style={{ marginTop: 6 }}>
            Le Club a ouvert cette année. Je ne t'annonce pas un nombre de membres, parce
            qu'il serait faux — et parce que tu le vérifierais au premier écran après avoir
            payé.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
