import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Display, Eyebrow, Icon, Mesh, Num, Surface, useScheme, useToken } from '../../ds';

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
 * ⚠️ AUCUNE DONNÉE N'EST SIMULÉE SUR CES ÉCRANS, et c'est le fil du Club qui rend la règle
 * non négociable : un cours inventé est un cours qu'on croit avoir, mais un MESSAGE inventé
 * est attribué à quelqu'un — un nom, un métier, un quartier qui appartiennent à une personne
 * réelle. Chaque écran affiche donc ce qu'il reçoit par `useLocalSearchParams()`, ou un vide
 * qui dit ce qui n'est pas branché.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ClubLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

/** La hauteur de la barre du Club, hors zone sûre. L'encoche vient EN PLUS, jamais dedans. */
const BAR_H = 52;

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
  const t = useToken();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function retour() {
    if (router.canGoBack()) router.back();
    else router.replace('/club');
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + BAR_H + 18,
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 44,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <Surface
        level="chrome"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: insets.top + BAR_H, paddingTop: insets.top,
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6,
          borderRadius: 0, borderWidth: 0,
          borderBottomWidth: 1, borderBottomColor: t('chromeBrd'),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir au Club"
          onPress={retour}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
            transform: [{ scale: pressed ? 0.975 : 1 }],
          })}
        >
          <Icon name="back" size={21} color={t('ink')} />
        </Pressable>
        <Body style={{ flex: 1, fontSize: 13.5, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>
          {titre}
        </Body>
        {/* Rien à droite. La cloche de la maquette porterait un badge de notifications que
            ce port ne sait pas compter — un badge faux vaut moins qu'une barre nue. */}
        <View style={{ width: 44 }} />
      </Surface>
    </View>
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
  const t = useToken();
  const scheme = useScheme();
  const p = useLocalSearchParams<{
    depuis?: string; echeance?: string; rappel?: string; releve?: string;
    sessions?: string; opportunites?: string; missions?: string;
  }>();

  const asOf = dateReleve(p.releve);
  const stats = [
    { ...mesure(p.sessions, asOf), label: 'sessions suivies' },
    { ...mesure(p.opportunites, asOf), label: 'opportunités vues' },
    { ...mesure(p.missions, asOf), label: 'missions décrochées' },
  ];

  /*
    LE PANNEAU DE NUIT EST SOMBRE EN MODE CLAIR ET CLAIR EN MODE NUIT : `Surface level="night"`
    pose le voile `--glass-d-a` sur fond clair, et une simple pellicule blanche sur fond
    sombre. L'encre doit donc suivre LE PANNEAU, pas le mode — sans quoi elle disparaît dans
    l'un des deux. `paperFixed` est le blanc INVARIANT du système, celui que les boutons de
    territoire emploient déjà pour la même raison. Aucune valeur n'est écrite en dur.
  */
  const panneauClair = scheme === 'dark';
  const encre = panneauClair ? t('textBody') : t('paperFixed');
  const encre2 = panneauClair ? t('textMuted') : t('paperFixed');
  const opac2 = panneauClair ? 1 : 0.74;
  const depuis = texte(p.depuis);
  const echeance = texte(p.echeance);
  const rappel = texte(p.rappel);

  return (
    <Surface level="night" style={{ padding: 18 }}>
      <Eyebrow style={{ color: encre2, opacity: opac2 }}>
        {depuis === null ? 'Ton abonnement' : `Ton abonnement, depuis ${depuis}`}
      </Eyebrow>
      <Display size="xs" style={{ marginTop: 5, color: encre }}>Ce qu'il t'a apporté</Display>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ flex: 1 }}>
            {/* Le repli « non relevé » garde la taille d'une PHRASE, pas celle d'un chiffre :
                il se lit, il ne se compare pas. */}
            <Num
              value={s.value}
              source="server"
              asOf={s.asOf}
              style={{ fontSize: s.value === null ? 12.5 : 23, color: encre }}
            />
            <Body style={{ fontSize: 10.5, lineHeight: 14, marginTop: 2, color: encre2, opacity: opac2 }}>
              {s.label}
            </Body>
          </View>
        ))}
      </View>

      <View style={{ height: 1, marginVertical: 14, backgroundColor: encre, opacity: 0.16 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Body style={{ fontSize: 12, color: encre2, opacity: opac2 }}>Échéance</Body>
        <Num
          value={echeance}
          source="server"
          asOf={asOf ?? EPOQUE}
          fallback="échéance non transmise"
          style={{ fontSize: 12.5, color: encre }}
        />
      </View>

      <Body style={{ fontSize: 11.5, lineHeight: 17, marginTop: 10, color: encre2, opacity: opac2 }}>
        {rappel === 'oui'
          ? 'Tu as demandé le rappel quinze jours avant. Rien n\'est prélevé automatiquement : à l\'échéance ton accès s\'arrête, et tu réabonnes si tu veux.'
          : rappel === 'non'
            ? 'Tu n\'as pas demandé le rappel quinze jours avant. Rien n\'est prélevé automatiquement : à l\'échéance ton accès s\'arrête, et tu réabonnes si tu veux.'
            : 'Rien n\'est prélevé automatiquement : à l\'échéance ton accès s\'arrête, et tu réabonnes si tu veux. Le rappel quinze jours avant est un réglage de ton compte — cet écran ne sait pas encore te dire s\'il est actif, et je ne vais pas te l\'annoncer avant de le savoir.'}
      </Body>

      <Body style={{ fontSize: 11.5, lineHeight: 17, marginTop: 8, color: encre2, opacity: opac2 }}>
        Ce bilan reste en tête toute l'année, pas seulement le dernier jour.
      </Body>
    </Surface>
  );
}
