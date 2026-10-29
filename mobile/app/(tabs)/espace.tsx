import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Pressoir, IconButton,
  Avatar, Body, Button, Display, Eyebrow, Gradient, Icon, Ligne, Liste, Num,
  ProgressBar, QuotaMeter, Reprise, Rubrique, SansDonnees, Screen, Surface, useActionGradient,
  useToken, useTutorNom,
} from '../../ds';
import { QUOTA } from '../../contenu/demo';
import { provenance, useEspace, useMoi, useRafraichir } from '../../donnees';
import { ChargementEspace } from '../../ecrans/ChargementEspace';
import { BandeauHorsLigne } from '../../ecrans/BandeauHorsLigne';
import { useResumeTelechargements } from '../../donnees/hors-ligne';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 3 · MON ESPACE ══ — LA REPRISE EST LE PREMIER OBJET, ET ÇA NE SE NÉGOCIE PAS.
 *
 * Elle l'est parce que, au web, **la relance ne pouvait venir que de l'écran** : la plateforme
 * n'a aucun canal d'envoi. Toute la conception s'est pliée à cette contrainte — si la personne
 * ne revient pas d'elle-même, rien ne la ramène.
 *
 * CE QUI CHANGE EN NATIF TIENT DANS UNE CARTE. La notification donne enfin ce canal, donc
 * l'écran propose de l'activer — **une fois, pas à chaque ouverture**. Une carte qui redemande
 * à chaque lancement est une publicité pour soi-même, et elle se ferme sans être lue.
 *
 * ── CE QUE CET ÉCRAN N'AFFICHE PAS ────────────────────────────────────────────────────────
 * Aucun classement, aucun « tu es meilleur que 62 % des membres », aucune série qui menace de
 * se rompre en gros. La série est là, sans compte à rebours et avec son record à côté : c'est
 * un fait, pas un levier.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « Vendredi 4 septembre ». Écrit à la main : `Intl` n'est pas garanti sur tous les moteurs. */
function dateDuJour(d: Date): string {
  const jour = JOURS[d.getDay()];
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/**
 * LA SALUTATION SUIT L'HEURE DU TÉLÉPHONE, pas une valeur figée. Le transfert écrit
 * « Bonsoir » parce que sa personne-témoin travaille après 21 h — c'est une donnée de SA
 * mémoire de profil, pas une constante du produit. Figer « Bonsoir » ici dirait bonsoir à
 * 8 h du matin.
 */
function salutation(d: Date): string {
  const h = d.getHours();
  if (h < 6) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

/* Les trois portes de l'espace existent toujours ; seul leur RELEVÉ dépend du contenu.
   Une entrée sans son compte reste une entrée — c'est le compte qui ment, pas le chemin. */
const ESPACE = [
  { href: '/certificats', glyphe: 'doc' as const, titre: 'Mes certificats', meta: undefined },
  /* Le relevé des téléchargements est MESURÉ sur l'appareil (`useResumeTelechargements`). */
  { href: '/telechargements', glyphe: 'download' as const, titre: 'Téléchargements', meta: undefined },
] as const;

export default function Espace() {
  const t = useToken();
  const moi = useMoi();
  const espace = useEspace();
  const g = useActionGradient();
  const tuteur = useTutorNom();
  const telechargements = useResumeTelechargements();
  const maintenant = new Date();
  const { enRafraichissement, rafraichir } = useRafraichir();

  /* Tant qu'aucune des deux lectures n'est tranchée, le squelette À LA FORME de cet écran :
     quand le contenu arrive, rien ne saute. Dès qu'une réponse arrive — même vide, même en
     panne — l'écran réel prend le relais et dit lui-même ce qui manque. */
  const enAttente = (e: { phase: string }) => e.phase === 'restauration' || e.phase === 'charge';
  if (enAttente(moi) && enAttente(espace)) return <ChargementEspace />;

  /* La reprise nomme SA formation : sans paramètre, la leçon se devinait côté écran. */
  const reprise = espace.valeur?.formationId
    ? { pathname: '/lecon' as const, params: { formationId: espace.valeur.formationId } }
    : '/lecon' as const;

  /*
   * ⚠️ CE CHOIX NE SURVIT PAS À LA SESSION, ET C'EST DÉLIBÉRÉ tant que Firebase n'est pas là.
   * Il vit dans le PROFIL (`users/<uid>.pushAsked`), comme le nom du tuteur : un magasin local
   * créerait une seconde source de vérité à réconcilier, et la carte reviendrait sur un autre
   * appareil alors que la question a déjà été posée.
   */

  return (
    <Screen
      territory="transforme"
      espace="hub"
      tabbar
      onRefresh={rafraichir}
      enRafraichissement={enRafraichissement}
      /* La cloche ÉTEINTE est partie : aucun canal de notification n'existe, et une icône qui
         ne répond pas, en haut du premier écran, dit « inachevé » avant tout le reste. */
      droite={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Passe 2 (maquette 08/09) : la cloche revient, et elle mène à une boîte RÉELLE —
              vide, et qui dit pourquoi. Elle n'est plus une affordance qui ne répond pas. */}
          <IconButton label="Notifications" onPress={() => router.push('/notifications')}>
            <Icon name="bell" size={18} color={t('textBody')} strokeWidth={2} />
          </IconButton>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ton profil"
            onPress={() => router.push('/(tabs)/profil')}
            hitSlop={4}
          >
            <Avatar initials={moi.valeur?.initiale ?? ''} size={38} decoratif />
          </Pressable>
        </View>
      }
    >
      <BandeauHorsLigne />
      <Eyebrow style={{ marginTop: 6 }}>{dateDuJour(maintenant)}</Eyebrow>
      {/* La salutation tient sans le prénom : l'heure du téléphone suffit à la rendre vraie. */}
      {/* Le grand titre du kit (`mm-r__large`) : une ligne, « Bonsoir, Prénom ». */}
      <Display
        size={32}
        lines={moi.valeur ? [`${salutation(maintenant)}, ${moi.valeur.prenom}`] : [`${salutation(maintenant)}.`]}
        style={{ marginTop: 6 }}
      />

      {/* ── PREMIER OBJET. La reprise, avant tout le reste — et quand il n'y a rien à
             reprendre, c'est CETTE place qui doit le dire, pas un vide en bas d'écran. ── */}
      {espace.valeur === null ? (
        <SansDonnees
          quoi="ta progression"
          etat={espace}
          hauteur={4}
          style={{ marginTop: 20 }}
          action={<Button tone="forme" label="Voir le catalogue" onPress={() => router.push('/(tabs)/cours')} />}
        />
      ) : (
      <Reprise
        espace="edu"
        style={{ marginTop: 20 }}
        surtitre={espace.valeur.arret ?? undefined}
        titre={espace.valeur.leconEnCours ?? espace.valeur.titreCourt}
        progression={espace.valeur.progression}
        onPress={() => router.push(reprise)}
        meta={
          /* La provenance vient de l'ÉTAT : `source` et `asOf` disent d'où vient ce compte. */
          <Num
            value={`${espace.valeur.leconsFaites} / ${espace.valeur.lecons} leçons · ${espace.valeur.progression} %`}
            source={espace.source}
            asOf={espace.asOf}
            style={{ fontSize: 12.5, color: t('paperFixed') }}
          />
        }
      />
      )}

      {/* ⚠️ LA CARTE « JE TE PRÉVIENS LA PROCHAINE FOIS ? » A ÉTÉ RETIRÉE — 05/09/2026.
          Elle promettait « une notification, et tu reprends », sur le PREMIER écran de
          l'application. Or aucun canal de notification n'existe : `expo-notifications` n'est
          pas installé, aucune permission n'est demandée, et aucun serveur n'envoie quoi que
          ce soit. Son bouton « Activer » menait à `/permissions`, un écran qui ne demande
          rien et se contente de passer au suivant.

          Ce n'était donc pas un contrôle mort — c'était une PROMESSE. Quelqu'un qui appuie
          sur « Activer » compte sur un rappel qui ne viendra jamais, et n'ouvrira pas
          l'application en l'attendant.

          Elle reviendra avec `expo-notifications` ET un émetteur, pas avant. */}

      {/* ── DEUX FAITS, SANS LEVIER. Sans relevé, ils ne s'affichent pas : une série à zéro
             qu'on n'a pas mesurée se lit comme une série perdue.

          ⚠️ CE BLOC AFFICHAIT DEUX NOMBRES FABRIQUÉS — « Série 3 j · record 7 j » et
          « Niveau 4 » à 60 % — cités depuis le kit de transfert. Et `SOURCE`/`RELEVE` ne
          passent PAS sous l'interrupteur de démonstration : ces valeurs s'affichaient donc
          en PRODUCTION, à toute personne connectée ayant une inscription. Un utilisateur
          réel lisait sa série et son niveau, tous deux inventés — et le commentaire
          ci-dessus jurait le contraire.

          Le serveur connaît deux choses vraies : l'XP (`appMoi`) et l'avancement du cours en
          reprise (`appEspace`). Ni série, ni record, ni niveau. On affiche donc ce qui est
          mesuré, et on l'affiche avec sa provenance. ── */}
      {espace.valeur === null ? null : (
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Surface level="flat" style={{ flex: 1, padding: 16 }}>
          <Eyebrow>Expérience</Eyebrow>
          <Num
            value={moi.valeur?.xp ?? null}
            {...provenance(moi)}
            unit="XP"
            style={{ fontSize: 25, marginTop: 4 }}
          />
          <Body muted style={{ fontSize: 11.5 }}>gagnée en terminant des leçons</Body>
        </Surface>
        <Surface level="flat" style={{ flex: 1, padding: 16 }}>
          <Eyebrow>Ta reprise</Eyebrow>
          <Num
            value={espace.valeur.leconsFaites}
            {...provenance(espace)}
            style={{ fontSize: 25, marginTop: 4 }}
          />
          <Body muted style={{ fontSize: 11.5 }}>
            leçons sur {espace.valeur.lecons}
          </Body>
          <ProgressBar value={espace.valeur.progression} height={5} territory="transforme" style={{ marginTop: 7 }} />
        </Surface>
      </View>
      )}

      {/* ── LE RÉPÉTITEUR, ET SON QUOTA ANNONCÉ D'AVANCE ────────────────────────────────── */}
      <Pressoir
        accessibilityRole="button"
        accessibilityLabel={`Demande à ${tuteur}`}
        onPress={() => router.push('/(tabs)/repetiteur')}
        style={{ marginTop: 14 }}
      >
        <Surface level="flat" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* L'étincelle de l'assistant (`mm-r-mark`), sur le dégradé violet. */}
          <Gradient
            colors={g.transforme}
            radius={14}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="sparkles" size={22} color={t('paperFixed')} strokeWidth={2.1} />
          </Gradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* « Demande à ton coach » cassait les noms propres : un tuteur renommé « Awa »
                devenait « ton awa ». Le nom s'écrit tel quel. */}
            <Body style={{ fontWeight: '700', fontSize: 16 }}>Demande à {tuteur}</Body>
            <Body muted style={{ fontSize: 13, marginTop: 1 }}>Il sait où tu en es.</Body>
            {/* Le quota est ANNONCÉ avant d'être atteint — mais on n'annonce pas un plafond
                qu'on n'a pas relevé : ce serait promettre des questions qu'on ne peut pas tenir. */}
            {QUOTA ? <QuotaMeter used={QUOTA.utilise - 1} total={QUOTA.total} style={{ marginTop: 8 }} /> : null}
          </View>
          <Icon name="forward" size={18} color={t('ink3')} strokeWidth={2.2} />
        </Surface>
      </Pressoir>

      {/* Passe 2 (maquette 08) : « De Max-Morrys » — les contenus et l'appel s'ouvrent d'ici
          (PRD rév. 6 §5.1). Les épisodes eux-mêmes viennent du pôle média, qui les relève. */}
      <Rubrique>De Max-Morrys</Rubrique>
      <Liste>
        <Ligne icone="mic" fondIcone={t('mmOrange')} titre="Écouter et lire" sous="le podcast, les vidéos, les articles" onPress={() => router.push('/media')} />
        <Ligne icone="phone" titre="Réserver un appel" sous="30 min · gratuit" onPress={() => router.push('/rendez-vous')} />
        <Ligne icone="store" titre="Commerces et TPE" sous="un site pour ta boutique" onPress={() => router.push('/presence')} />
      </Liste>

      <Rubrique>Dans ton espace</Rubrique>
      <Liste>
        <Ligne icone="card" titre="Mes paiements" sous="faits sur le site" onPress={() => router.push('/paiements')} />
        {ESPACE.map((e) => (
          <Ligne
            key={e.href}
            icone={e.glyphe}
            fondIcone={e.href === '/telechargements' ? t('mmTeal') : t('mmBleu')}
            titre={e.titre}
            sous={e.href === '/telechargements' ? telechargements : e.meta}
            onPress={() => router.push(e.href)}
          />
        ))}
      </Liste>
    </Screen>
  );
}
