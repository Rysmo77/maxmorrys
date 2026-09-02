import { View } from 'react-native';
import { router } from 'expo-router';
import { openAuthSessionAsync } from 'expo-web-browser';
import {
  Body, Button, CheckLine, Display, Eyebrow, Icon, LessonRow, Num, Screen, Surface,
  type IconName, isIOS, useToken,
} from '../../ds';
import { CLUB, QUOTA, RELEVE, SITE, SOURCE } from '../../contenu/reference';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 5 · LE CLUB, MUR D'ABONNEMENT ══ — MÊME RÈGLE QUE LES FORMATIONS.
 *
 * 19 900 F encaissés dans l'application imposent l'achat intégré (App Store 3.1.1, Play
 * Payments), donc la commission et la disparition de Wave et d'Orange Money. Le mur renvoie
 * au site, comme celui des cours, et pour les mêmes raisons — mais il porte deux choses de
 * plus, parce qu'un abonnement n'est pas un achat :
 *
 *   · **LE PRIX EST CADRÉ AU MOIS ET À L'ANNÉE.** « 1 658 F / mois » est ce qu'on compare
 *     mentalement ; « facturé 19 900 F, une fois, pour douze mois » est ce qu'on paie. Donner
 *     l'un sans l'autre est un prix qui ment par omission, dans un sens ou dans l'autre.
 *   · **CE QUI N'EST PAS PROMIS EST ÉCRIT.** Le Club a ouvert cette année : pas de nombre de
 *     membres, parce qu'il serait faux — et parce qu'il se vérifie au premier écran APRÈS le
 *     paiement, c'est-à-dire au pire moment possible.
 *
 * ── ET LES HUIT ONGLETS RESTENT ATTEIGNABLES ─────────────────────────────────────────────
 * Aucun n'est grisé. Chacun s'ouvre et dit lui-même ce qui n'est pas branché chez lui : c'est
 * plus honnête qu'une porte fermée qui ne dit pas pourquoi, et ça permet de juger AVANT de
 * payer — la même logique que le module 1 gratuit des formations.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const ONGLETS: Array<{ href: string; icon: IconName; titre: string; ligne: string }> = [
  { href: '/club/fil', icon: 'comment', titre: 'Le fil', ligne: 'Ce qui se passe cette semaine, et ton échéance en tête.' },
  { href: '/club/discussions', icon: 'chat', titre: 'Discussions', ligne: 'La question bête se pose ici, par catégorie.' },
  { href: '/club/agenda', icon: 'calendar', titre: 'Agenda', ligne: 'Sessions en ligne, ateliers à Dakar.' },
  { href: '/club/membre', icon: 'user', titre: 'Membre', ligne: "La fiche de quelqu'un, et le signalement." },
  { href: '/club/classement', icon: 'medal', titre: 'Classement', ligne: "Par vague d'arrivée, jamais absolu." },
  { href: '/club/opportunites', icon: 'case', titre: 'Opportunités', ligne: "Missions et appels d'offres, budget annoncé." },
  { href: '/club/parrainage', icon: 'gift', titre: 'Parrainage', ligne: 'La remise va au filleul, pas à toi.' },
  { href: '/club/infos', icon: 'info', titre: 'Infos', ligne: "Ce qui est garanti, et ce qui ne l'est pas." },
];

export default function Club() {
  const t = useToken();

  return (
    <Screen territory="transforme" tabbar titre={isIOS ? undefined : 'Le Club'}>
      <Eyebrow style={{ marginTop: 6 }}>Je te transforme · payant, fermé</Eyebrow>
      <Display size={29} lines={['LE CLUB DES', 'DIGITOS.']} style={{ marginTop: 8 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        Une année avec moi, et avec ceux qui font la même chose que toi. Des sessions en direct,
        des missions qui circulent, et quelqu'un à qui poser la question que tu ne poses à
        personne.
      </Body>

      {/* ── LE MUR ─────────────────────────────────────────────────────────────────────── */}
      <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Num
            value={CLUB.prixMois}
            source={SOURCE}
            asOf={RELEVE}
            style={{ fontSize: 34, letterSpacing: -1.5, color: t('mmVioletT') }}
          />
          <Body style={{ fontSize: 14, fontWeight: '600' }}>F / mois</Body>
        </View>
        <Body muted style={{ fontSize: 13, marginTop: 5 }}>
          Facturé{' '}
          <Num value={CLUB.prixAn} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 13 }} />
          , une fois, pour douze mois.
        </Body>

        <View style={{ height: 1, backgroundColor: t('borderHair'), marginVertical: 15 }} />

        <Body muted style={{ fontSize: 13.5, lineHeight: 21 }}>
          L'abonnement se prend <Body style={{ fontWeight: '700', fontSize: 13.5 }}>sur le site</Body> —
          {' '}{isIOS ? "l’App Store" : 'Google Play'} exige son propre système de paiement pour
          tout achat fait dans une application, et il ne connaît ni Wave ni Orange Money.
        </Body>

        <Button
          tone="transforme"
          label="Ouvrir sur maxmorrys.me"
          trailing="forward"
          style={{ marginTop: 15 }}
          onPress={() => { void openAuthSessionAsync(`${SITE}/club`, 'rysmo://paiement/retour'); }}
        />
        <Body muted style={{ fontSize: 11.5, textAlign: 'center', marginTop: 10, color: t('textFaint') }}>
          Parrainé ? Ton code te fait{' '}
          <Num value={CLUB.prixParraine} source={SOURCE} asOf={RELEVE} unit="F" style={{ fontSize: 11.5 }} />.
        </Body>
      </Surface>

      {/* ── CE QU'ON PAIE, PRÉCISÉMENT ─────────────────────────────────────────────────── */}
      <Eyebrow style={{ marginTop: 24 }}>Ce que tu paies, précisément</Eyebrow>
      <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
        <CheckLine style={{ marginTop: 0 }}>2 sessions en direct par mois, avec moi</CheckLine>
        <CheckLine>Les missions que je sors de mon carnet</CheckLine>
        <CheckLine>Les ateliers à Dakar, places membres</CheckLine>
        <CheckLine>Une réponse de moi, pas d'un modérateur</CheckLine>
        <CheckLine>
          Ton répétiteur à {QUOTA.total} questions/jour au lieu de 2
        </CheckLine>
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
