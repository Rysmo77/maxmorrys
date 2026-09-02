import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar, Body, Button, ChipRow, Icon, LessonRow, Num, PriceBlock, Surface, Tag,
  TerritoryCard, useToken,
} from '../../ds';
import { Bilan, ClubScreen } from './_layout';
import { CLUB_FIL, CLUB_MISSION, RELEVE, SOURCE } from '../../contenu/reference';

/**
 * ══ 6 · LE FIL DU CLUB ══
 *
 * **LE BILAN D'ABONNEMENT EST EN TÊTE, ET IL EST PERMANENT.** C'est le premier des six
 * engagements du Club, et il répond à un problème précis : « un abonnement annuel ne supprime
 * pas le renoncement, il le CONCENTRE sur un instant. » Onze mois de silence, puis 19 900 F
 * d'un coup — le renoncement ne se prépare pas pendant l'année, il tombe d'un bloc à
 * l'échéance. Un bilan affiché le dernier jour arrive toujours trop tard.
 *
 * LA CARTE EST DE L'ENCRE OPAQUE, parce que la page est CLAIRE (voir `Bilan` dans `_layout`).
 *
 * ── LE FIL N'EST PAS UN FIL D'ACTUALITÉ ──────────────────────────────────────────────────
 * Pas de compteur de vues, pas de « tendance », pas d'ordre décidé par un moteur. Des gens qui
 * montrent ce qu'ils ont essayé, dans l'ordre où ils l'ont écrit — et une mission, quand il y
 * en a une, avec son budget ANNONCÉ PAR LA PERSONNE QUI PUBLIE. Ce dernier point est écrit
 * sur la carte : un budget qui aurait l'air de venir de nous fixerait une attente de revenu.
 */
export default function Fil() {
  const t = useToken();

  return (
    <ClubScreen titre="Le fil">
      <Bilan />

      <ChipRow
        options={['Fil', 'Discussions', 'Membres', 'Opportunités']}
        value="Fil"
        onChange={(v) => {
          if (v === 'Discussions') router.push('/club/discussions');
          if (v === 'Membres') router.push('/club/membre');
          if (v === 'Opportunités') router.push('/club/opportunites');
        }}
        style={{ marginTop: 18 }}
      />

      {CLUB_FIL.map((post) => (
        <Surface key={post.auteur} level="flat" style={{ marginTop: 14, padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 11, alignItems: 'center' }}>
            <Avatar initials={post.initiales} size={38} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 14, fontWeight: '600' }}>{post.auteur}</Body>
              <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('textFaint') }}>
                {post.categorie} · {post.quand}
              </Body>
            </View>
            <Tag>{post.categorie}</Tag>
          </View>

          <Body style={{ marginTop: 12, lineHeight: 21 }}>{post.texte}</Body>

          {/* Trois compteurs, et aucun n'est un score : ils disent ce que d'autres ont FAIT
              de ce message, pas ce qu'il « vaut ». */}
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 14, alignItems: 'center' }}>
            {([
              ['heart', post.aime, `${post.aime} personnes ont aimé`],
              ['repeat', post.republie, `${post.republie} republications`],
              ['comment', post.commente, `${post.commente} réponses`],
            ] as const).map(([glyphe, n, label]) => (
              <View
                key={glyphe}
                accessible
                accessibilityLabel={label}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Icon name={glyphe} size={16} color={glyphe === 'heart' ? t('mmVioletT') : t('ink2')} />
                <Num value={n} source={SOURCE} asOf={RELEVE} style={{ fontSize: 12.5 }} />
              </View>
            ))}
          </View>
        </Surface>
      ))}

      <View style={{ marginTop: 12 }}>
        <TerritoryCard
          first
          territory="transforme"
          meta={CLUB_MISSION.meta}
          title={CLUB_MISSION.titre}
          titleSize={21}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 12, marginTop: 14,
          }}>
            <PriceBlock
              amount={CLUB_MISSION.budget}
              source={SOURCE}
              asOf={RELEVE}
              size={21}
              note={CLUB_MISSION.note}
            />
            <Button
              tone="transforme"
              size="sm"
              label="Postuler"
              onPress={() => router.push('/club/opportunites')}
            />
          </View>
        </TerritoryCard>
      </View>

      <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
        <LessonRow
          icon={<Icon name="calendar" size={14} color={t('ink2')} />}
          title="La prochaine session"
          meta="jeudi 10 septembre · 20:00"
          trailing={<Icon name="forward" size={16} color={t('ink3')} strokeWidth={2.4} />}
          onPress={() => router.push('/club/agenda')}
          last
        />
      </Surface>
    </ClubScreen>
  );
}
