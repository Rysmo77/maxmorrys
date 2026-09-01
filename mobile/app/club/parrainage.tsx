import { useState } from 'react';
import { Share, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Body, Button, DocLine, Display, EmptyState, Eyebrow, Icon, Num, StatTile, Surface, useToken,
} from '../../ds';
import { ClubScreen, dateReleve, mesure, texte } from './_layout';

/**
 * ── 8 · PARRAINAGE ────────────────────────────────────────────────────────────────────
 *
 * LE PARRAINAGE NE RAPPORTE RIEN AU PARRAIN, et c'est le quatrième engagement du Club.
 * « Rien en argent, et je ne vais pas te faire croire le contraire. La remise va au
 * filleul. » Un écran de parrainage est précisément l'endroit où un produit invente une
 * contrepartie ; celui-ci dit ce qu'il en est avant qu'on partage, pas après.
 *
 * ET LA REMISE EST CALCULÉE CÔTÉ SERVEUR. Ce n'est pas une note d'implémentation : c'est ce
 * qui fait qu'elle ne dépend pas du lien sur lequel on a cliqué, ni de ce que l'application
 * a en mémoire. D'où le taux lu par la route et jamais écrit ici en dur — l'application ne
 * fixe pas le prix qu'elle affiche.
 *
 * ⚠️ AUCUN COMPTEUR DE PARTAGES, contrairement à la maquette qui en pose un à côté des
 * filleuls. Le site tranche déjà : « un lien copié ne laisse aucune trace, et un chiffre à
 * cet endroit serait inventé ». Il n'y a donc qu'une case ici, celle des inscriptions
 * abouties — et un zéro DATÉ y est une information, contrairement à un tiret.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function ClubParrainage() {
  const t = useToken();
  const p = useLocalSearchParams<{
    code?: string; taux?: string; filleuls?: string; releve?: string; lien?: string;
  }>();
  const [partage, setPartage] = useState<string | null>(null);

  const asOf = dateReleve(p.releve);
  const code = texte(p.code);
  const lien = texte(p.lien);
  const taux = mesure(p.taux, asOf);
  const filleuls = mesure(p.filleuls, asOf);

  async function partager() {
    if (code === null) return;
    try {
      await Share.share({
        message: lien === null
          ? `Rejoins le Club des Digitos avec mon code ${code} : la remise est pour toi.`
          : `Rejoins le Club des Digitos avec mon code ${code} : la remise est pour toi. ${lien}`,
      });
      setPartage(null);
    } catch {
      // Le motif, la conséquence, la sortie. Jamais d'excuse, et jamais un faux succès.
      setPartage("Le partage ne s'est pas ouvert. Ton code reste affiché au-dessus : tu peux le recopier à la main.");
    }
  }

  return (
    <ClubScreen titre="Parrainage">
      <Display size="sm" lines={['FAIS-LUI', 'GAGNER LA', 'REMISE.']} />

      <Body muted style={{ marginTop: 12 }}>
        Ton code fait baisser le prix du Club pour la personne que tu parraines. La remise est
        calculée côté serveur, au moment où elle paie : elle ne dépend ni du lien sur lequel
        elle a cliqué, ni de ce que cette application a en mémoire.
      </Body>

      {code === null ? (
        <Surface level="flat" style={{ marginTop: 18, paddingVertical: 6 }}>
          <EmptyState
            glyph={<Icon name="gift" size={24} color={t('mmVioletT')} />}
            title="Ton code n'est pas encore chargé"
            body="Les codes de parrainage sont créés côté serveur et rattachés à ton compte. Cet écran n'en devine pas un : un code inventé serait un code qui n'applique aucune remise, découvert par ton filleul au moment de payer."
          />
        </Surface>
      ) : (
        <Surface level="hero" style={{ marginTop: 18, padding: 22 }}>
          <Eyebrow>Ton code</Eyebrow>
          <Num
            value={code}
            source="server"
            asOf={asOf ?? new Date(0)}
            style={{ fontSize: 31, letterSpacing: 3, marginTop: 6 }}
          />
          <Button
            tone="transforme"
            label="Partager"
            onPress={partager}
            style={{ marginTop: 16 }}
          />
          {partage === null ? null : (
            <Body style={{ marginTop: 10, fontSize: 12.5, color: t('stop') }}>{partage}</Body>
          )}
        </Surface>
      )}

      <Surface level="flat" style={{ marginTop: 12, padding: 18 }}>
        <DocLine
          label="Taux de la remise, pour ton filleul"
          value={
            <Num
              value={taux.value === null ? null : `${taux.value} %`}
              source="server"
              asOf={taux.asOf}
              fallback="non relevé"
            />
          }
          last
        />
        <Body muted style={{ marginTop: 8, fontSize: 12.5 }}>
          Le taux affiché est celui que le serveur applique. Tant qu'il n'est pas lu, cet
          écran ne l'annonce pas — un pourcentage écrit en dur ici finirait par mentir le jour
          où la grille bouge.
        </Body>
      </Surface>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <StatTile
          label="Filleuls inscrits"
          value={filleuls.value}
          source="db"
          asOf={asOf}
          foot="inscriptions abouties"
          style={{ flex: 1 }}
        />
      </View>

      <Surface level="truth" style={{ marginTop: 18, padding: 18 }}>
        <Eyebrow>Ce que tu gagnes, toi</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Rien en argent, et je ne vais pas te faire croire le contraire. La remise va au
          filleul. Ce que tu gagnes, c'est quelqu'un de plus dans le Club avec qui avancer.
        </Body>
        <Body muted style={{ marginTop: 8, fontSize: 12.5 }}>
          Et il n'y a pas de compteur de partages : un lien copié ne laisse aucune trace, donc
          un chiffre à cet endroit serait inventé. La case ci-dessus ne compte que les
          inscriptions abouties.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
