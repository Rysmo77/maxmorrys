import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Body, ChipRow, Display, EmptyState, Eyebrow, Icon, Num, StatTile, Surface, useToken,
} from '../../ds';
import { ClubScreen, dateReleve, mesure, texte } from './_layout';

/**
 * ── 6 · CLASSEMENT ────────────────────────────────────────────────────────────────────
 *
 * LE CLASSEMENT EST PAR VAGUE D'ARRIVÉE, JAMAIS ABSOLU — deuxième engagement du Club, et
 * le seul qui soit une décision de PRODUIT plutôt qu'une décision d'honnêteté.
 *
 * « Un classement absolu flatte les premiers et fait décrocher les derniers. » Sur une
 * communauté annuelle payante, décrocher n'est pas un désagrément : c'est le renoncement à
 * l'échéance, onze mois plus tôt. D'où les deux vues, et seulement ces deux-là :
 *
 *   Ma cohorte      — comparé aux gens arrivés EN MÊME TEMPS que toi.
 *   Ma progression  — comparé à toi seul, la semaine dernière.
 *
 * Il n'y a pas de troisième onglet « Général », et il n'y en aura pas.
 *
 * ⚠️ ET AUCUN NOMBRE DE MEMBRES, MÊME ICI. La maquette écrit « Arrivés en février ·
 * 9 membres » sur ce bandeau — c'est la seule ligne du kit qui contredise l'interdit qu'il
 * pose trois fois par ailleurs. La taille de la vague n'est pas rendue : elle serait fausse,
 * et elle se vérifie au premier écran. Le rang, lui, suffit à situer.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
const VUES = ['Ma cohorte', 'Ma progression'] as const;

export default function ClubClassement() {
  const t = useToken();
  const [vue, setVue] = useState<string>(VUES[0]);
  const p = useLocalSearchParams<{
    rang?: string; vague?: string; points?: string; semaine?: string; releve?: string;
  }>();

  const asOf = dateReleve(p.releve);
  const rang = mesure(p.rang, asOf);
  const points = mesure(p.points, asOf);
  const semaine = mesure(p.semaine, asOf);
  const vague = texte(p.vague);

  // Le bandeau porte l'aplat du territoire, pas le dégradé du kit : `linear-gradient` n'existe
  // pas en React Native, et le premier arrêt du dégradé EST la teinte du Club. `paperFixed`
  // est le blanc invariant — le même que les boutons de territoire, pour la même raison.
  const blanc = t('paperFixed');

  return (
    <ClubScreen titre="Classement">
      <ChipRow options={VUES} value={vue} onChange={setVue} />

      <View style={{
        marginTop: 16, padding: 24, borderRadius: 22,
        backgroundColor: t('mmViolet'), borderWidth: 1, borderColor: t('borderGlass'),
      }}>
        <Eyebrow style={{ color: blanc, opacity: 0.74 }}>
          {vague === null ? "Ta vague d'arrivée" : `Arrivés en ${vague}`}
        </Eyebrow>

        {rang.value === null ? (
          <>
            <Display size="xs" style={{ marginTop: 7, lineHeight: 26, color: blanc }}>
              Ton rang de vague n'est pas encore relevé
            </Display>
            <Num
              value={null}
              source="db"
              asOf={rang.asOf}
              fallback="rang non relevé"
              style={{ marginTop: 6, color: blanc, opacity: 0.8 }}
            />
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 7 }}>
            <Display size="xs" style={{ color: blanc }}>Tu es</Display>
            <Num value={`${rang.value}e`} source="db" asOf={rang.asOf} style={{ fontSize: 28, color: blanc }} />
            <Display size="xs" style={{ color: blanc }}>de ta vague</Display>
          </View>
        )}

        <Body style={{ fontSize: 13, lineHeight: 19, marginTop: 9, color: blanc, opacity: 0.86 }}>
          Comparé aux gens arrivés en même temps que toi. Pas à ceux qui ont deux ans d'avance.
        </Body>
      </View>

      {vue === 'Ma cohorte' ? (
        <>
          <Eyebrow style={{ marginTop: 22 }}>Ta vague</Eyebrow>
          <Surface level="flat" style={{ marginTop: 10, paddingVertical: 6 }}>
            <EmptyState
              glyph={<Icon name="medal" size={24} color={t('mmVioletT')} />}
              title="La vague n'est pas encore chargée"
              body="Les gens arrivés en même temps que toi, et leurs points, viennent de la base. Je n'en fabrique pas : un classement inventé attribue un rang et un score à des personnes qui existent, et le rang est ce qu'on regarde en premier."
            />
          </Surface>
        </>
      ) : (
        <>
          <Eyebrow style={{ marginTop: 22 }}>Toi, semaine après semaine</Eyebrow>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <StatTile
              label="Tes points"
              value={points.value}
              source="db"
              asOf={asOf}
              style={{ flex: 1 }}
            />
            <StatTile
              label="Cette semaine"
              value={semaine.value}
              source="db"
              asOf={asOf}
              style={{ flex: 1 }}
            />
          </View>
          <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
            <Body style={{ fontWeight: '700' }}>Cette vue ne te compare qu'à toi-même</Body>
            <Body muted style={{ marginTop: 8, fontSize: 13 }}>
              Pas de voisin de classement, pas de premier de la liste. Deux relevés datés : où
              tu en es, et ce que tu as ajouté depuis la semaine dernière. Tant qu'ils ne sont
              pas branchés, ils disent « non relevé » — un tiret cacherait la différence entre
              « c'est zéro » et « je ne sais pas ».
            </Body>
          </Surface>
        </>
      )}

      <Surface level="truth" style={{ marginTop: 18, padding: 18 }}>
        <Eyebrow>Pourquoi ce n'est pas un classement général</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Un classement absolu flatte les premiers et fait décrocher les derniers. Celui-ci te
          compare à ta vague d'arrivée, et « Ma progression » ne te compare qu'à toi-même.
        </Body>
        <Body muted style={{ marginTop: 8, fontSize: 12.5 }}>
          Tu ne verras pas non plus la taille de ta vague. Ce nombre-là, je ne l'annonce
          nulle part.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
