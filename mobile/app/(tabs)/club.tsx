import { router } from 'expo-router';
import {
  Body, Button, CheckLine, Display, Eyebrow, SansDonnees, Screen, Skeleton, Surface,
  type IconName, isIOS, Ligne, Liste, ChipRow, Rubrique,
} from '../../ds';
import { QUOTA } from '../../contenu/demo';
import { ONGLETS_CLUB } from '../../contenu/club';
import { useClub, useRafraichir } from '../../donnees';

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
 * Le Club a ouvert récemment : pas de nombre de membres, parce qu'il serait faux. Ce bloc
 * de vérité n'avait rien à voir avec le prix, et il survit intact.
 *
 * ── ET LES HUIT ONGLETS RESTENT ATTEIGNABLES ─────────────────────────────────────────────
 * Aucun n'est grisé. Chacun s'ouvre et dit lui-même ce qui n'est pas branché chez lui : c'est
 * plus honnête qu'une porte fermée qui ne dit pas pourquoi. Voir ce à quoi on n'a pas encore
 * accès n'est pas une vente — c'est une carte.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
/**
 * Les huit onglets viennent de `contenu/club.ts`, la liste que lit aussi la bande. « Comptes
 * bloqués » n'est pas un onglet du kit, mais une DESTINATION que la guideline App Store 1.2
 * veut trouvable : elle s'ajoute ici, après les huit.
 */
const ENTREES: ReadonlyArray<{ href: string; icon: IconName; titre: string; ligne: string }> = [
  ...ONGLETS_CLUB.map((o) => ({ href: o.href, icon: o.icon, titre: o.libelle, ligne: o.ligne })),
  { href: '/club/bloques', icon: 'user', titre: 'Comptes bloqués', ligne: 'Ce que tu ne veux plus lire, et comment défaire.' },
];

export default function Club() {
  const club = useClub();
  const { enRafraichissement, rafraichir } = useRafraichir();
  /* ⚠️ L'ÉTAT D'ADHÉSION SE DÉCIDE SUR LA PHASE, PAS SUR L'ABSENCE DE VALEUR. `club.valeur
     === null` valait aussi pendant le chargement et en panne : un membre lisait « réservé aux
     membres » à chaque ouverture, le temps que la réponse arrive. */
  const enLecture = club.phase === 'charge' || club.phase === 'restauration';
  const ferme = club.phase === 'vide' && club.ferme === true;

  return (
    <Screen
      territory="transforme"
      tabbar
      titre={isIOS ? undefined : 'Le Club'}
      onRefresh={rafraichir}
      enRafraichissement={enRafraichissement}
    >
      {/* Le grand titre du kit v4.5 (`mm-r__large`), puis la bande des huit onglets
          (`mm-r-band`) : depuis le hub, aucun n'est encore ouvert. */}
      <Eyebrow style={{ marginTop: 6 }}>Club des Digitos · réservé aux membres</Eyebrow>
      <Display size={32} lines={['Le Club']} style={{ marginTop: 6 }} />
      <ChipRow
        options={ONGLETS_CLUB.map((o) => o.libelle)}
        value=""
        height={38}
        debord={18}
        icones={ferme ? Object.fromEntries(ONGLETS_CLUB.map((o) => [o.libelle, 'lock' as const])) : undefined}
        onChange={(libelle) => {
          const cible = ONGLETS_CLUB.find((o) => o.libelle === libelle);
          if (cible) router.push(cible.href);
        }}
        style={{ marginTop: 14 }}
      />
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
      {enLecture ? (
        <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
          <Skeleton width="58%" height={20} label="Lecture de ton adhésion" />
          <Skeleton width="92%" height={13} style={{ marginTop: 12 }} />
          <Skeleton width="70%" height={13} style={{ marginTop: 8 }} />
        </Surface>
      ) : club.phase === 'servie' || club.phase === 'replique' ? (
        <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
          <Display size={19}>Tu es membre.</Display>
          <Body muted style={{ marginTop: 9, fontSize: 13.5, lineHeight: 21 }}>
            Tout ce qui suit est ouvert. Les sessions en direct, le fil, les opportunités et le
            classement se rejoignent depuis les onglets ci-dessous.
          </Body>
        </Surface>
      ) : ferme ? (
        <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
          <Display size={19}>Le Club est réservé aux membres.</Display>
          <Body muted style={{ marginTop: 9, fontSize: 13.5, lineHeight: 21 }}>
            Ton accès s'ouvre ici dès qu'il est actif — les sessions, le fil, les opportunités,
            tout arrive dans cette application, sans rien à faire de plus.
          </Body>
        </Surface>
      ) : (
        <SansDonnees
          quoi="ton adhésion"
          etat={club}
          hauteur={2}
          style={{ marginTop: 18 }}
          action={club.phase === 'anonyme'
            ? <Button tone="transforme" label="Me connecter" onPress={() => router.push('/connexion')} />
            : undefined}
        />
      )}

      {/* ── CE QUE LE CLUB DONNE ───────────────────────────────────────────────────────
          Le titre disait « Ce que tu paies, précisément ». Le verbe « payer » n'a plus sa
          place dans une application qui ne vend rien — et il portait la même charge que le
          bouton qu'on vient de retirer. */}
      <Rubrique>Ce que le Club donne</Rubrique>
      <Surface level="flat" style={{ padding: 18 }}>
        <CheckLine style={{ marginTop: 0 }}>2 sessions en direct par mois, avec moi</CheckLine>
        <CheckLine>Les missions que je sors de mon carnet</CheckLine>
        <CheckLine>Les ateliers à Dakar, places membres</CheckLine>
        <CheckLine>Une réponse de moi, pas d'un modérateur</CheckLine>
        {/* Le plafond relevé, ou rien : « 5 questions » écrit sans mesure est une promesse. */}
        {QUOTA ? (
          <CheckLine>Ton assistant à {QUOTA.total} questions/jour au lieu de 2</CheckLine>
        ) : (
          <CheckLine>Ton assistant à un plafond de questions plus haut</CheckLine>
        )}
      </Surface>

      {/* ── LES HUIT ONGLETS, OUVERTS ──────────────────────────────────────────────────── */}
      <Rubrique>Huit onglets, tous visitables</Rubrique>
      <Liste>
        {ENTREES.map((o) => (
          <Ligne
            key={o.href}
            icone={o.icon}
            titre={o.titre}
            /* `meta` est une fente MONOSPACE — durée, compte, date. Une phrase n'y va pas :
               la monospace est réservée aux nombres vérifiables. D'où un nœud, pas une chaîne. */
            sous={<Body muted style={{ fontSize: 12.5, lineHeight: 17 }}>{o.ligne}</Body>}
            onPress={() => router.push(o.href)}
          />
        ))}
      </Liste>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Ce que je ne te promets pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Ni des clients, ni un revenu : l'abonnement donne l'accès, le reste dépend de ce que tu
          y mets.
        </Body>
      </Surface>
    </Screen>
  );
}
