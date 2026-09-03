import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Display, Eyebrow, Num, Screen, Surface, useToken } from '../../ds';
import { CLUB, RELEVE as REFERENCE_ASOF, SOURCE as REFERENCE_SOURCE } from '../../contenu/demo';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE CLUB, EN PILE — huit onglets, un écran chacun, tous derrière le même paiement.
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
  return <Stack screenOptions={{ headerShown: false }} />;
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
      {children}
    </Screen>
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
export function Bilan() {
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
    ? (CLUB?.bilan ?? [
      { n: null, l: 'sessions suivies' },
      { n: null, l: 'opportunités vues' },
      { n: null, l: 'missions décrochées' },
    ]).map((b) => ({ value: b.n as number | null, asOf: REFERENCE_ASOF, label: b.l }))
    : [
      { ...mesure(p.sessions, asOf), label: 'sessions suivies' },
      { ...mesure(p.opportunites, asOf), label: 'opportunités vues' },
      { ...mesure(p.missions, asOf), label: 'missions décrochées' },
    ];

  const depuis = texte(p.depuis) ?? CLUB?.depuis ?? null;
  const echeance = texte(p.echeance) ?? CLUB?.echeance ?? null;
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
            <Body muted style={{ fontSize: 10.5, lineHeight: 14, marginTop: 2 }}>{s.label}</Body>
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
