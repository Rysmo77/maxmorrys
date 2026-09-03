import { router } from 'expo-router';
import {
  Body, Button, CheckLine, Display, Eyebrow, LessonRow, Num, SansDonnees, Surface, useToken,
} from '../../ds';
import { ClubScreen } from './_layout';
import { CLUB, CLUB_INFOS, RELEVE, SOURCE } from '../../contenu/demo';

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

  return (
    <ClubScreen titre="Infos">
      <Display size={24} lines={["Ce que l'abonnement", 'te donne.']} />

      {CLUB_INFOS === null ? (
        <SansDonnees
          quoi="ce que l'abonnement donne"
          origine="du serveur"
          degat="Les deux listes de cet écran — ce qui est garanti et ce qui ne l'est pas — sont un engagement. En écrire une version approximative reviendrait à promettre à la place du produit."
          style={{ marginTop: 22 }}
        />
      ) : (
      <>
      <Eyebrow style={{ marginTop: 22 }}>Garanti</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        {CLUB_INFOS.garanti.map((g, i) => (
          <CheckLine key={g} tone="ok" style={i === 0 ? { marginTop: 0 } : undefined}>{g}</CheckLine>
        ))}
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Pas garanti</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        {CLUB_INFOS.pasGaranti.map((g, i) => (
          <CheckLine key={g} tone="neutre" dash style={i === 0 ? { marginTop: 0 } : undefined}>{g}</CheckLine>
        ))}
        <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 14, color: t('textFaint') }}>
          Cette seconde liste est la raison d'être de cette page. Une page d'informations qui
          n'énumère que des promesses vend une deuxième fois quelqu'un qui a déjà payé.
        </Body>
      </Surface>
      </>
      )}

      {/* Le prix ne s'écrit pas dans l'application : `tests/unit/club-pricing.test.ts` pose
          que la seule source admise est `lib/club/pricing`. Ici, il arrive ou il manque. */}
      {CLUB === null ? null : (
      <>
      <Eyebrow style={{ marginTop: 22 }}>Le prix, cadré deux fois</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        <LessonRow
          title="Au mois, pour comparer"
          trailing={<Num value={CLUB.prixMois} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 13 }} />}
        />
        <LessonRow
          title="À l'année, pour payer"
          meta="une fois, pour douze mois"
          trailing={<Num value={CLUB.prixAn} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 13 }} />}
        />
        <LessonRow
          title="Avec un code de parrainage"
          meta="la remise va au filleul"
          trailing={<Num value={CLUB.prixParraine} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 13 }} />}
          onPress={() => router.push('/club/parrainage')}
          last
        />
      </Surface>
      </>
      )}

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>Le renouvellement n'est pas automatique</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Wave et Orange Money ne font pas de prélèvement récurrent. À l'échéance{' '}
          {CLUB ? <Num value={CLUB.echeance} source={SOURCE} asOf={RELEVE} style={{ fontSize: 12.5 }} /> : 'de ton abonnement'}
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
