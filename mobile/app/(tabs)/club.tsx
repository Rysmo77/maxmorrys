import { router } from 'expo-router';
import {
  Body, CheckLine, Display, Eyebrow, Icon, LessonRow, Screen,
  Surface, type IconName, isIOS, useToken,
} from '../../ds';
import { QUOTA } from '../../contenu/demo';
import { useClub } from '../../donnees';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 5 · LE CLUB ══ — L'ACCÈS, PAS LA VENTE.
 *
 * Cet écran était un MUR D'ABONNEMENT : prix au mois, prix à l'année, prix parrainé, un
 * paragraphe sur les commissions des magasins, et deux boutons vers la boutique du site.
 * L'application ne vend plus rien, alors tout cela est parti — y compris le texte, qui
 * NOMMAIT le magasin dont il contournait la règle.
 *
 * ⚠️ Le mot « payant » a disparu du bandeau lui aussi. Il ne restait pas grand-chose après
 * le retrait du bloc, mais il suffisait : dans une application qui ne vend rien, annoncer
 * une section « payante » désigne un achat introuvable — et invite précisément le relecteur
 * à le chercher.
 *
 * ── CE QUI N'EST PAS PROMIS RESTE ÉCRIT ──────────────────────────────────────────────
 * Le Club a ouvert cette année : pas de nombre de membres, parce qu'il serait faux. Ce bloc
 * de vérité n'avait rien à voir avec le prix, et il survit intact.
 *
 * ── ET LES HUIT ONGLETS RESTENT ATTEIGNABLES ─────────────────────────────────────────────
 * Aucun n'est grisé. Chacun s'ouvre et dit lui-même ce qui n'est pas branché chez lui : c'est
 * plus honnête qu'une porte fermée qui ne dit pas pourquoi. Voir ce à quoi on n'a pas encore
 * accès n'est pas une vente — c'est une carte.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const ONGLETS: Array<{ href: string; icon: IconName; titre: string; ligne: string }> = [
  { href: '/club/fil', icon: 'comment', titre: 'Le fil', ligne: 'Ce qui se passe cette semaine, et ton échéance en tête.' },
  { href: '/club/discussions', icon: 'chat', titre: 'Discussions', ligne: 'La question bête se pose ici, par catégorie.' },
  { href: '/club/agenda', icon: 'calendar', titre: 'Agenda', ligne: 'Sessions en ligne, ateliers à Dakar.' },
  /* ⚠️ « Membre » A ÉTÉ REMPLACÉ. Il menait à `/club/membre` sans désigner personne : une
     fiche est un détail, pas une destination — elle s'ouvre en touchant l'auteur d'un
     message. Les comptes bloqués, eux, sont bien une destination, et la guideline App Store
     1.2 veut qu'elle soit trouvable. */
  { href: '/club/bloques', icon: 'user', titre: 'Comptes bloqués', ligne: 'Ce que tu ne veux plus lire, et comment défaire.' },
  { href: '/club/classement', icon: 'medal', titre: 'Classement', ligne: "Par vague d'arrivée, jamais absolu." },
  { href: '/club/opportunites', icon: 'case', titre: 'Opportunités', ligne: "Missions et appels d'offres, budget annoncé." },
  { href: '/club/parrainage', icon: 'gift', titre: 'Parrainage', ligne: 'La remise va au filleul, pas à toi.' },
  { href: '/club/infos', icon: 'info', titre: 'Infos', ligne: "Ce qui est garanti, et ce qui ne l'est pas." },
];

export default function Club() {
  const t = useToken();
  const club = useClub();

  return (
    <Screen territory="transforme" tabbar titre={isIOS ? undefined : 'Le Club'}>
      <Eyebrow style={{ marginTop: 6 }}>Je te transforme · réservé aux membres</Eyebrow>
      <Display size={29} lines={['LE CLUB DES', 'DIGITOS.']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Une année avec moi, et avec ceux qui font la même chose que toi. Des sessions en direct,
        des missions qui circulent, et quelqu'un à qui poser la question que tu ne poses à
        personne.
      </Body>

      {/* ── L'ÉTAT D'ADHÉSION, SANS PRIX ET SANS PORTE DE SORTIE ─────────────────────
          Ce bloc portait le prix mensuel, le prix annuel, le prix parrainé, un paragraphe
          expliquant pourquoi le magasin refuse Wave et Orange Money, et deux boutons
          « Ouvrir sur maxmorrys.me ». C'était une page de vente dans une application qui
          n'a pas le droit d'en avoir une.

          Ce qui le remplace ne dit ni combien ni où : l'application OUVRE ce qui est déjà
          acquis. Membre, les huit onglets vivent ; non-membre, ils restent visibles et
          cadenassés — voir ce à quoi on n'a pas accès n'est pas une vente, c'est une carte. */}
      <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
        <Display size={19}>{club.valeur === null ? 'Le Club est réservé aux membres.' : 'Tu es membre.'}</Display>
        <Body muted style={{ marginTop: 9, fontSize: 13.5, lineHeight: 21 }}>
          {club.valeur === null
            ? "Ton accès s'ouvre ici dès qu'il est actif — les sessions, le fil, les opportunités, tout arrive dans cette application, sans rien à faire de plus."
            : 'Tout ce qui suit est ouvert. Les sessions en direct, le fil, les opportunités et le classement se rejoignent depuis les onglets ci-dessous.'}
        </Body>
      </Surface>

      {/* ── CE QUE LE CLUB DONNE ───────────────────────────────────────────────────────
          Le titre disait « Ce que tu paies, précisément ». Le verbe « payer » n'a plus sa
          place dans une application qui ne vend rien — et il portait la même charge que le
          bouton qu'on vient de retirer. */}
      <Eyebrow style={{ marginTop: 24 }}>Ce que le Club donne</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        <CheckLine style={{ marginTop: 0 }}>2 sessions en direct par mois, avec moi</CheckLine>
        <CheckLine>Les missions que je sors de mon carnet</CheckLine>
        <CheckLine>Les ateliers à Dakar, places membres</CheckLine>
        <CheckLine>Une réponse de moi, pas d'un modérateur</CheckLine>
        {/* Le plafond relevé, ou rien : « 5 questions » écrit sans mesure est une promesse. */}
        {QUOTA ? (
          <CheckLine>Ton répétiteur à {QUOTA.total} questions/jour au lieu de 2</CheckLine>
        ) : (
          <CheckLine>Ton répétiteur à un plafond de questions plus haut</CheckLine>
        )}
      </Surface>

      {/* ── LES HUIT ONGLETS, OUVERTS ──────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 24 }}>Huit onglets, tous visitables</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
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

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Ce que je ne te promets pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Le Club a ouvert cette année. Je ne t'annonce pas un nombre de membres, parce qu'il
          serait faux — et parce que tu le vérifierais au premier écran après avoir payé. Ni des
          clients, ni un revenu : l'abonnement donne l'accès, le reste dépend de ce que tu y mets.
        </Body>
      </Surface>
    </Screen>
  );
}
