import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import {
  Body, Button, ChipRow, Display, Eyebrow, Gradient, Heros, Icon, Num, Pressoir, Screen, Surface,
  screenAnimation, useMouvement, useToken,
} from '../../ds';
import { RELEVE as REFERENCE_ASOF, SOURCE as REFERENCE_SOURCE } from '../../contenu/demo';
import { provenance, useApercuClub, useClub } from '../../donnees';
import { ONGLETS_CLUB, ongletDe, type OngletClub } from '../../contenu/club';
import { VERROUS } from '../../contenu/verrous';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE CLUB, EN PILE — huit onglets, un écran chacun, une bande pour passer de l'un à l'autre.
 *
 * Le Club est du PAYANT FERMÉ, et c'est ce qui gouverne ces huit écrans : ce qu'on promet
 * avant de payer doit être vrai au PREMIER écran après. Quelqu'un qui vient de débiter
 * 19 900 F vérifie, et il a raison de vérifier.
 *
 * D'OÙ CE FICHIER, ET CE QU'IL PORTE EN PLUS DE LA PILE. `ClubScreen` et `Bilan` sont
 * partagés par plusieurs onglets. Ils ne peuvent pas vivre dans un fichier voisin : dans
 * `app/`, TOUT fichier `.tsx` devient une route — `_bilan.tsx` s'ouvrirait à `/club/_bilan`.
 * Seul `_layout` échappe à la règle. C'est donc ici, une fois, plutôt que recopié huit fois.
 *
 * ⚠️ CES ÉCRANS AFFICHENT DU CONTENU DE DÉMONSTRATION, et c'est le fil du Club qui rend la
 * chose la plus coûteuse : un cours inventé est un cours qu'on croit avoir, mais un MESSAGE
 * inventé est ATTRIBUÉ À QUELQU'UN — un nom, un métier, un quartier. « Seynabou K. » et
 * « Fatou D. » n'ont rien écrit.
 *
 * Ce commentaire affirmait l'inverse, et il était faux depuis le portage du transfert. Il est
 * corrigé plutôt que laissé à quelqu'un qui l'aurait cru. Un paramètre de route prime toujours
 * sur la référence, et `contenu/demo.ts` est le seul endroit d'où ce contenu peut sortir.
 * L'interrupteur de `contenu/mode.ts` le ferme en production : ces écrans y montrent alors ce
 * qu'ils ne savent pas, au lieu de le mettre dans la bouche de quelqu'un.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ClubLayout() {
  const { reduit } = useMouvement();
  /*
   * PASSER D'UN ONGLET À L'AUTRE EST UN FONDU, 180 ms — comme la barre d'onglets. La bande
   * remplace l'écran : un glissé latéral y créait une « géographie fausse », comme si
   * Agenda était À DROITE de Fil. La fiche d'un membre, elle, est un DÉTAIL : elle pousse.
   */
  return (
    <Stack screenOptions={{ headerShown: false, animation: reduit ? 'none' : 'fade', animationDuration: 180 }}>
      <Stack.Screen name="membre" options={{ animation: reduit ? 'none' : screenAnimation }} />
      <Stack.Screen name="bloques" options={{ animation: reduit ? 'none' : screenAnimation }} />
    </Stack>
  );
}

/** L'époque, quand aucune date de relevé n'est arrivée. `<Num>` écrira « non relevé ». */
const EPOQUE = new Date(0);

/* ── Les paramètres de route, lus honnêtement ────────────────────────────────────────── */

/** Un paramètre, ou `null`. Le routeur peut rendre un tableau ; une chaîne vide n'est rien. */
export function texte(v: string | string[] | undefined): string | null {
  const s = Array.isArray(v) ? v[0] : v;
  const net = (s ?? '').trim();
  return net === '' ? null : net;
}

/** Une date de relevé ISO. Une date illisible vaut une date absente — jamais « aujourd'hui ». */
export function dateReleve(v: string | string[] | undefined): Date | null {
  const s = texte(v);
  if (s === null) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * LA RÈGLE 6, RENDUE STRUCTURELLE : un nombre n'existe QUE s'il arrive avec sa date.
 *
 * Sans date de relevé, la valeur retombe à `null` et `<Num>` écrit « non relevé ». Pas un
 * tiret : un tiret cache la différence entre « c'est zéro » et « je ne sais pas », et cette
 * différence est précisément l'information. Un zéro DATÉ, lui, s'affiche — c'en est une.
 */
export function mesure(
  v: string | string[] | undefined,
  asOf: Date | null,
): { value: number | null; asOf: Date } {
  const s = texte(v);
  const n = s === null ? null : Number(s);
  const bon = asOf !== null && n !== null && Number.isFinite(n);
  return { value: bon ? (n as number) : null, asOf: asOf ?? EPOQUE };
}

/* ── La coquille commune ─────────────────────────────────────────────────────────────── */

/**
 * LE FLOU N'A DROIT QU'AU CHROME FIXE (règle 1), ET C'EST ICI QU'IL EST POSÉ.
 *
 * La barre haute ne défile pas : c'est la seule surface de l'écran qui peut être floutée,
 * et elle l'est UNE fois, ici, pour les huit onglets. Tout ce qui défile en dessous prend
 * `Surface level="flat"` — le faux verre, gratuit à faire défiler. Poser la règle dans la
 * coquille plutôt que dans chaque écran, c'est ce qui empêche le huitième de l'oublier.
 */
export function ClubScreen({ titre, children }: { titre: string; children: ReactNode }) {
  const router = useRouter();
  const club = useClub();
  const onglet = ongletDe(usePathname());
  /* Le serveur a dit « pas pour toi » (`appClub` → `sansAcces`), pas « rien ». Toute autre
     réponse — servie, vide, en panne — laisse l'écran dire lui-même ce qu'il sait. */
  const verrou = club.phase === 'vide' && club.ferme === true;

  function retour() {
    if (router.canGoBack()) router.back();
    else router.replace('/club');
  }

  /*
    LA BARRE HAUTE PASSE PAR LE CHÂSSIS, et c'est ce qui règle d'un coup les huit onglets :
    44 px et un chevron + libellé sur iOS, 64 px et une flèche seule sur Android. Cette
    coquille dessinait sa propre barre, identique des deux côtés — soignée, mais iOS des deux
    côtés, ce qui est précisément le défaut que `ds/platform.ts` existe pour nommer.

    Le titre y sert de libellé de retour sur iOS (« Club »), parce que le libellé doit dire OÙ
    l'on revient, pas d'où l'on part.
  */
  return (
    <Screen territory="transforme" retour="Club" onRetour={retour} titre={titre}>
      <BandeClub ferme={verrou} />
      {verrou ? <CorpsVerrouille onglet={onglet} /> : children}
    </Screen>
  );
}

/**
 * LA BANDE DES HUIT ONGLETS — l'enveloppe la pose, aucun écran ne peut l'oublier.
 *
 * ⛔ ELLE N'AVAIT JAMAIS ÉTÉ PORTÉE : passer d'un onglet à l'autre exigeait un retour au hub,
 * et cinq onglets sur huit n'étaient atteignables par aucun geste. `BandeClub` du kit.
 *
 * ⚠️ ELLE REMPLACE, ELLE N'EMPILE PAS. Huit onglets qui s'empilent feraient remonter le
 * retour système à travers l'historique des onglets au lieu de sortir du Club.
 *
 * `height={44}` est le plancher de cible tactile, pas une esthétique. Sur une fiche de membre
 * ou les comptes bloqués, aucun onglet n'est actif — la bande reste, pour repartir.
 */
function BandeClub({ ferme }: { ferme: boolean }) {
  const router = useRouter();
  const actif = ongletDe(usePathname());
  /* La bande DÉBORDE jusqu'aux bords de l'écran (la coupe dit « il y a une suite »), défile
     jusqu'à l'onglet ouvert, et porte un cadenas sur chaque onglet quand le Club est fermé :
     on sait avant de toucher ce qui s'ouvrira. */
  return (
    <ChipRow
      options={ONGLETS_CLUB.map((o) => o.libelle)}
      value={actif?.libelle ?? ''}
      height={44}
      debord={18}
      icones={ferme ? Object.fromEntries(ONGLETS_CLUB.map((o) => [o.libelle, 'lock' as const])) : undefined}
      onChange={(libelle) => {
        const cible = ONGLETS_CLUB.find((o) => o.libelle === libelle);
        if (cible && cible !== actif) router.replace(cible.href);
      }}
      style={{ marginTop: 4, marginBottom: 2 }}
    />
  );
}

/**
 * LE CORPS VERROUILLÉ — à la place du contenu, jamais par-dessus.
 *
 * ⛔ AUCUN FLOU. Le pari du kit est de ne RIEN flouter : à la place, les compteurs RÉELS
 * (`appApercuClub`, comptés sur tout le Club, avec leur date de relevé) et un élément entier.
 * L'aperçu reste DÉCRIT plutôt que fabriqué — un aperçu inventé mettrait dans la bouche d'un
 * membre réel des mots qu'il n'a pas écrits.
 *
 * ⚠️ NI PRIX, NI MAGASIN, NI BOUTON D'ACHAT : l'application ne vend rien (`mobile-store-achats`).
 * Le kit pose ici le prix et un lien sortant ; la position retenue est celle du hub — l'accès
 * s'ouvre dans l'application dès qu'il est actif. C'est une décision ouverte, nommée à l'écran.
 */
function CorpsVerrouille({ onglet }: { onglet: OngletClub | null }) {
  const t = useToken();
  const router = useRouter();
  const v = onglet ? VERROUS[onglet.libelle] : null;
  /* Les compteurs RÉELS, avec LEURS libellés : c'est le serveur qui sait ce qu'il mesure.
     Tant qu'il n'a pas répondu, les libellés du kit restent, chacun « non relevé ». */
  const apercu = useApercuClub();
  const servis = onglet ? apercu.valeur?.onglets.find((o) => o.onglet === onglet.libelle)?.compteurs : undefined;
  const compteurs = servis ?? v?.compteurs.map((l) => ({ l, n: null })) ?? [];
  return (
    <>
      <Heros>
        <Gradient colors={[t('mmVioletN'), t('mmViolet')]} radius={18} style={{ width: 54, height: 54, marginTop: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={23} color={t('paperFixed')} strokeWidth={2.3} />
        </Gradient>
      </Heros>
      <Display size={27} lines={v ? [...v.titre] : ['RÉSERVÉ', 'AUX MEMBRES.']} style={{ marginTop: 16 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        {v ? v.quoi : "Cette partie du Club s'ouvre aux membres. Les onglets ci-dessus restent visitables."}
      </Body>

      {v ? (
        <>
          <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
            {/* La date du relevé est DITE : « en ce moment » sans date se lit comme un direct. */}
            <Eyebrow>
              {apercu.phase === 'servie'
                ? `Derrière ce cadenas, relevé le ${apercu.asOf.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                : 'Derrière ce cadenas'}
            </Eyebrow>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {compteurs.map((c) => (
                <View key={c.l} style={{ flex: 1 }}>
                  <Num value={c.n ?? null} {...provenance(apercu)} style={{ fontSize: c.n == null ? 12.5 : 21 }} />
                  <Body muted style={{ fontSize: 11.5, lineHeight: 15, marginTop: 4 }}>{c.l}</Body>
                </View>
              ))}
            </View>
          </Surface>

          <Eyebrow style={{ marginTop: 22 }}>{v.apercuTitre}</Eyebrow>
          <Surface level="flat" style={{ marginTop: 10, padding: 17 }}>
            <Body muted style={{ fontSize: 13, lineHeight: 20 }}>{v.apercuQuoi}</Body>
          </Surface>
        </>
      ) : null}

      <Body muted style={{ marginTop: 16, fontSize: 13, lineHeight: 20 }}>
        Ton accès s'ouvre ici dès qu'il est actif. En attendant, les onglets restent visitables,
        et le pôle média reste ouvert avec ton compte.
      </Body>
      {/* Une SORTIE, pas un mur : ce qui est ouvert sans le Club. */}
      <Button tone="quiet" size="sm" label="Écouter & regarder" icon="mic" style={{ marginTop: 12 }} onPress={() => router.push('/media')} />
    </>
  );
}

/* ── Le bilan ────────────────────────────────────────────────────────────────────────── */

/**
 * LE BILAN EST PERMANENT, PAS TERMINAL — et c'est le premier des six engagements du Club.
 *
 * « Un abonnement annuel ne supprime pas le renoncement, il le CONCENTRE sur un instant. »
 * Onze mois de silence, puis 19 900 F d'un coup : le renoncement ne se prépare pas pendant
 * l'année, il tombe d'un seul bloc à l'échéance. Un bilan affiché le dernier jour arrive donc
 * toujours trop tard. Celui-ci ouvre LE FIL et LES OPPORTUNITÉS, toute l'année.
 *
 * IL PORTE L'ÉCHÉANCE ET SON PRÉAVIS, parce que c'est la seule chose que la personne ne peut
 * pas déduire du reste. Et il les porte tels qu'ils SONT : rien n'est prélevé automatiquement
 * — Wave et Orange Money ne font pas de prélèvement récurrent — et le rappel avant l'échéance
 * est un réglage du compte, pas une promesse de cet écran.
 *
 * AUCUN DE SES TROIS NOMBRES N'EST FABRIQUÉ. Ils arrivent par la route avec leur date de
 * relevé, ou ils disent « non relevé ». Un bilan est exactement l'endroit où un chiffre
 * flatteur inventé se paierait le plus cher : c'est celui qu'on regarde avant de renoncer.
 */
/**
 * LE BILAN, PLIÉ PAR DÉFAUT EN TÊTE DU FIL ET DES OPPORTUNITÉS. Déplié, il poussait le
 * premier message sous le pli : on ouvrait le fil pour lire le fil, et on lisait d'abord son
 * abonnement. Plié, il tient sur une ligne — l'échéance — et se déplie d'un geste.
 */
export function BilanPlie() {
  const t = useToken();
  const club = useClub();
  const [ouvert, setOuvert] = useState(false);
  const echeance = club.valeur?.echeance ?? null;
  if (ouvert) {
    return (
      <View>
        <Bilan />
        <Button tone="quiet" size="sm" label="Replier le bilan" icon="chevron-up" style={{ marginTop: 10 }} onPress={() => setOuvert(false)} />
      </View>
    );
  }
  return (
    <Pressoir
      accessibilityRole="button"
      accessibilityLabel="Voir le bilan de ton abonnement"
      onPress={() => setOuvert(true)}
    >
      <Surface level="flat" style={{ paddingVertical: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="calendar" size={15} color={t('mmVioletT')} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <Body style={{ fontSize: 13.5, fontWeight: '600' }}>Ton abonnement</Body>
          {echeance ? (
            <Body muted style={{ fontSize: 12.5 }}>
              échéance <Num value={echeance} {...provenance(club)} style={{ fontSize: 12.5 }} />
            </Body>
          ) : null}
        </View>
        <Body muted style={{ fontSize: 12.5 }}>Bilan</Body>
        <Icon name="chevron" size={15} color={t('ink3')} strokeWidth={2.4} />
      </Surface>
    </Pressoir>
  );
}

export function Bilan() {
  const club = useClub();
  const p = useLocalSearchParams<{
    depuis?: string; echeance?: string; rappel?: string; releve?: string;
    sessions?: string; opportunites?: string; missions?: string;
  }>();

  /*
    LA CARTE EST DE L'ENCRE, PAS DU VERRE NUIT — et la nuance décide de sa lisibilité.

    `night` pose un VOILE d'encre : sur une page claire, il compose avec le fond et remonte à
    rgb(80,81,86), soit 2,61:1 sous un gris nuit. `ink` est OPAQUE, et il ouvre sa propre
    portée de thème : les textes à l'intérieur prennent l'encre NUIT tout seuls. C'est ce qui
    supprime les quatre variables d'encre que cette fonction calculait à la main — et avec
    elles, la possibilité qu'un cinquième texte ajouté plus tard les oublie.
  */
  const asOf = dateReleve(p.releve);
  /* D'où viennent les trois nombres : du serveur s'il a transmis sa date, du transfert sinon.
     Un booléen nommé, plutôt qu'une comparaison d'objets — celle-ci marchait par identité de
     référence, ce qui est vrai aujourd'hui et faux le jour où quelqu'un copie la date. */
  const deReference = asOf === null;
  const stats = deReference
    /* Aucun relevé transmis. En démonstration, le contenu du transfert ; en production, trois
       « non relevé » — le bilan garde sa PLACE, ce sont ses chiffres qui manquent. */
    ? (club.valeur?.bilan ?? [
      { n: null, l: 'sessions suivies' },
      { n: null, l: 'opportunités vues' },
      { n: null, l: 'missions décrochées' },
    ]).map((b: { n: number | null; l: string }) => ({
      value: b.n, asOf: REFERENCE_ASOF, label: b.l,
    }))
    : [
      { ...mesure(p.sessions, asOf), label: 'sessions suivies' },
      { ...mesure(p.opportunites, asOf), label: 'opportunités vues' },
      { ...mesure(p.missions, asOf), label: 'missions décrochées' },
    ];

  const depuis = texte(p.depuis) ?? club.valeur?.depuis ?? null;
  const echeance = texte(p.echeance) ?? club.valeur?.echeance ?? null;
  const rappel = texte(p.rappel);

  return (
    <Surface level="ink" style={{ padding: 18 }}>
      <Eyebrow>{depuis === null ? 'Ton abonnement' : `Ton abonnement, depuis ${depuis}`}</Eyebrow>
      <Display size={19} style={{ marginTop: 5 }}>Ce qu'il t'a apporté</Display>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ flex: 1 }}>
            {/* Le repli « non relevé » garde la taille d'une PHRASE, pas celle d'un chiffre :
                il se lit, il ne se compare pas. */}
            <Num
              value={s.value}
              source={deReference ? REFERENCE_SOURCE : 'server'}
              asOf={s.asOf}
              style={{ fontSize: s.value === null ? 12.5 : 23 }}
            />
            <Body muted style={{ fontSize: 11.5, lineHeight: 15, marginTop: 2 }}>{s.label}</Body>
          </View>
        ))}
      </View>

      <Separateur />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Body muted style={{ fontSize: 12 }}>Échéance</Body>
        <Num
          value={echeance}
          source={deReference ? REFERENCE_SOURCE : 'server'}
          asOf={asOf ?? REFERENCE_ASOF}
          fallback="échéance non transmise"
          style={{ fontSize: 12.5 }}
        />
      </View>

      <Body muted style={{ fontSize: 11.5, lineHeight: 17, marginTop: 10 }}>
        {rappel === 'oui'
          ? "Tu as demandé le rappel quinze jours avant. Rien n'est prélevé automatiquement : à l'échéance ton accès s'arrête, et tu réabonnes si tu veux."
          : rappel === 'non'
            ? "Tu n'as pas demandé le rappel quinze jours avant. Rien n'est prélevé automatiquement : à l'échéance ton accès s'arrête, et tu réabonnes si tu veux."
            : "Rien n'est prélevé automatiquement : à l'échéance ton accès s'arrête, et tu réabonnes si tu veux. Le rappel quinze jours avant est un réglage de ton compte."}
      </Body>

      <Body muted style={{ fontSize: 11.5, lineHeight: 17, marginTop: 8 }}>
        Ce bilan reste en tête toute l'année, pas seulement le dernier jour.
      </Body>
    </Surface>
  );
}

/**
 * Le filet de la carte d'encre. Il est un COMPOSANT et pas une ligne écrite dans `Bilan` :
 * `useToken()` doit être appelé DANS la portée nuit ouverte par `Surface level="ink"`, et un
 * hook appelé au-dessus lirait l'encre du mode clair — un filet noir sur une carte noire.
 */
function Separateur() {
  const t = useToken();
  return <View style={{ height: 1, marginVertical: 14, opacity: 0.16, backgroundColor: t('ink') }} />;
}
