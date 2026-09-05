import { router } from 'expo-router';
import {
  Body, Button, CheckLine, Display, Eyebrow, LessonRow, Num, Surface, useToken,
} from '../../ds';
import { ClubScreen } from './_layout';
import { CLUB_GARANTI, CLUB_PAS_GARANTI } from '../../contenu/engagement';
import { provenance, useClub } from '../../donnees';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ── CLUB · LES INFOS ── **CE QUI EST GARANTI, ET CE QUI NE L'EST PAS.**
 *
 * Les deux listes se lisent ensemble, et la seconde est la raison d'être de l'écran. Une page
 * d'informations qui n'énumère que des promesses n'informe personne : elle vend une deuxième
 * fois quelqu'un qui a déjà payé.
 *
 * ── LE RENOUVELLEMENT N'EST PAS AUTOMATIQUE, ET C'EST UNE CONTRAINTE DEVENUE UNE PROMESSE ──
 * Wave et Orange Money ne font pas de prélèvement récurrent. À l'échéance, l'accès s'arrête —
 * personne n'est débité par surprise, et personne n'a à chercher où résilier. C'est écrit ici
 * en toutes lettres parce que c'est ce qu'on redoute en s'abonnant.
 *
 * ── ET LE PRIX EST CADRÉ DEUX FOIS ───────────────────────────────────────────────────────
 * Au mois pour comparer, à l'année pour payer. Donner l'un sans l'autre ment par omission,
 * dans un sens ou dans l'autre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ClubInfos() {
  const t = useToken();
  const club = useClub();
  const echeance = club.valeur?.echeance ?? null;

  return (
    <ClubScreen titre="Infos">
      <Display size={24} lines={["Ce que l'abonnement", 'te donne.']} />

      {/* ⚠️ CES DEUX LISTES NE SONT PLUS UN `SansDonnees`. Elles vivaient sous l'interrupteur
          de démonstration, donc elles disparaissaient en production — et l'écran affichait
          alors « en attente du serveur », pour une promesse que personne n'a jamais eu
          l'intention de ranger dans un serveur. Elles sont l'engagement commercial du
          produit : voir `contenu/engagement.ts`. */}
      <Eyebrow style={{ marginTop: 22 }}>Garanti</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        {CLUB_GARANTI.map((g, i) => (
          <CheckLine key={g} tone="ok" style={i === 0 ? { marginTop: 0 } : undefined}>{g}</CheckLine>
        ))}
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Pas garanti</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        {CLUB_PAS_GARANTI.map((g, i) => (
          <CheckLine key={g} tone="neutre" dash style={i === 0 ? { marginTop: 0 } : undefined}>{g}</CheckLine>
        ))}
        <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 14, color: t('textFaint') }}>
          Cette seconde liste est la raison d'être de cette page. Une page d'informations qui
          n'énumère que des promesses vend une deuxième fois quelqu'un qui a déjà payé.
        </Body>
      </Surface>

      {/* ⚠️ LES TROIS PRIX ONT ÉTÉ RETIRÉS D'ICI — au mois, à l'année, avec parrainage.
          L'application ne vend rien : afficher le tarif d'un abonnement qu'on ne peut pas
          souscrire ne renseigne personne et désigne un achat introuvable. Le parrainage, lui,
          reste atteignable : son intérêt est la RÈGLE (la remise va au filleul), pas le
          montant — et cette règle vaut d'être lue par un membre déjà inscrit. */}
      <Eyebrow style={{ marginTop: 22 }}>Le parrainage</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          title="Ton code, et ce qu'il donne"
          meta="la remise va au filleul, jamais au parrain"
          onPress={() => router.push('/club/parrainage')}
          last
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Le renouvellement n'est pas automatique</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Ton accès ne se reconduit pas tout seul. À l'échéance{' '}
          {echeance === null
            ? 'de ton abonnement'
            : <Num value={echeance} {...provenance(club)} style={{ fontSize: 12.5 }} />}
          , ton accès s'arrête et tu réabonnes si tu veux. Personne n'est débité par surprise,
          et personne n'a à chercher où résilier.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 17 }}>
        <Eyebrow>Et pas de nombre de membres</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Le Club a ouvert cette année. Je ne t'annonce pas un nombre de membres, parce qu'il
          serait faux — et parce que tu le vérifierais au premier écran après avoir payé.
        </Body>
      </Surface>

      <Button
        tone="quiet"
        label="Voir ce que le Club coûte"
        style={{ marginTop: 16 }}
        onPress={() => router.push('/(tabs)/club')}
      />
    </ClubScreen>
  );
}
