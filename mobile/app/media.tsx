import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, Display, EmptyState, Eyebrow, Icon, Mesh, Num, Skeleton, Surface, Tag, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE PÔLE MÉDIA — RANGÉ SOUS « JE TE TRANSFORME », ET GRATUIT DÈS LA PREMIÈRE LIGNE.
 *
 * Le blog donne une méthode, le podcast donne une voix : ce territoire-ci abritait du payant
 * fermé, d'où le mot « gratuit » dans le premier sourcil et le Club jamais devant.
 *
 * TROIS ÉTATS, ET AUCUN N'EST DÉCORATIF — c'est l'écran de liste de ce lot, donc c'est ici
 * que les règles d'état se rencontrent pour de bon :
 *
 *   • CHARGEMENT — la route n'a rien apporté. Un SQUELETTE à la forme exacte d'une fiche,
 *     jamais un rond qui tourne : un rond ne dit ni ce qui arrive, ni combien, ni où, et il
 *     laisse la mise en page se recomposer sous les yeux au remplissage. Il est accompagné
 *     d'une sortie, pour que ce ne soit jamais une attente sans issue.
 *   • VIDE — le relevé est arrivé et il vaut zéro. Un ZÉRO DATÉ est une information ; un
 *     tiret n'en est pas une. Avec une invitation à agir.
 *   • REMPLI — ce que la route a transmis, et rien de plus.
 *
 * AUCUN COMPTEUR D'ÉCOUTE N'EST AFFICHÉ. À un épisode, un compteur ne dit rien d'utile — et
 * `Video.views` existe bien dans `src/types/index.ts`, ce qui rend le silence délibéré plutôt
 * que subi.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const POLE = 'https://maxmorrys.me/podcast-et-videos';

type Fiche = {
  slug: string;
  titre: string;
  genre: 'audio' | 'video';
  resume?: string;
  date?: string;
  duree?: string;
};

export default function Media() {
  const t = useToken();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fiches, releve } = useLocalSearchParams<{ fiches?: string; releve?: string }>();

  const [ouverture, setOuverture] = useState(false);

  const brut = releve ? new Date(releve) : null;
  const date = brut !== null && !Number.isNaN(brut.getTime()) ? brut : null;

  const liste: Fiche[] = (() => {
    if (!fiches) return [];
    try {
      const v: unknown = JSON.parse(fiches);
      return Array.isArray(v) ? (v as Fiche[]) : [];
    } catch {
      return [];
    }
  })();

  async function ouvrirLePole() {
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync(POLE);
    } catch {
      Alert.alert("Le navigateur n'a pas pu s'ouvrir", `Ouvre ${POLE} depuis ton navigateur.`);
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Je te transforme · gratuit</Eyebrow>
        <View style={{ marginTop: 8 }}>
          <Display size="sm" lines={["DES GENS D'ICI", 'QUI RACONTENT', "CE QU'ILS ONT FAIT."]} />
        </View>
        <Body muted style={{ marginTop: 12 }}>
          Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent
          vraiment quelque chose à Dakar et à Abidjan racontent ce qui a marché, et ce qui leur
          a coûté cher.
        </Body>

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          <Tag tone="ok">Écoute gratuite, sans compte</Tag>
          <Tag>Transcription lisible sans audio</Tag>
        </View>

        <Eyebrow style={{ marginTop: 24 }}>Écouter &amp; regarder</Eyebrow>

        {!fiches ? (
          /* ── CHARGEMENT ─────────────────────────────────────────────────────────────
             La forme EXACTE d'une fiche : sourcil, titre sur deux lignes, résumé sur trois,
             la ligne de coût, deux boutons. Quand le contenu arrive, rien ne saute. */
          <View style={{ marginTop: 10, gap: 12 }}>
            {[0, 1].map((i) => (
              <Surface key={i} level="flat" style={{ padding: 18 }}>
                <Skeleton width={132} height={11} label="Chargement de la fiche" />
                <View style={{ marginTop: 12, gap: 8 }}>
                  <Skeleton height={22} width="88%" />
                  <Skeleton height={22} width="56%" />
                </View>
                <View style={{ marginTop: 14, gap: 7 }}>
                  <Skeleton height={12} width="100%" />
                  <Skeleton height={12} width="94%" />
                  <Skeleton height={12} width="61%" />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <Skeleton width={62} height={25} radius={999} />
                  <Skeleton width={78} height={25} radius={999} />
                </View>
                <View style={{ flexDirection: 'row', gap: 9, marginTop: 16 }}>
                  <Skeleton width={104} height={44} radius={999} />
                  <Skeleton width={150} height={44} radius={999} />
                </View>
              </Surface>
            ))}

            <Surface level="truth" style={{ padding: 18 }}>
              <Eyebrow>Ce que tu regardes</Eyebrow>
              <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
                La forme des fiches, pas les fiches : le catalogue arrive avec la route, et
                celle-ci ne l'a pas apporté. Rien ne sautera quand il arrivera — c'est tout
                l'intérêt d'un squelette plutôt que d'un rond qui tourne. En attendant, le pôle
                complet est lisible sur le site.
              </Body>
              <Button
                tone="quiet"
                label={ouverture ? 'Ouverture…' : 'Ouvrir le pôle sur le site'}
                disabled={ouverture}
                onPress={() => void ouvrirLePole()}
                style={{ marginTop: 14 }}
              />
            </Surface>
          </View>
        ) : liste.length === 0 ? (
          /* ── VIDE ─────────────────────────────────────────────────────────────────── */
          <Surface level="flat" style={{ marginTop: 10, padding: 6 }}>
            <EmptyState
              glyph={<Icon name="mic" size={26} color={t('mmVioletT')} />}
              title="Rien à écouter pour l'instant."
              body={
                <Body muted style={{ fontSize: 13.5, textAlign: 'center' }}>
                  <Num
                    value={date !== null ? 0 : null}
                    source="db"
                    asOf={date ?? new Date(0)}
                    unit="épisode publié"
                    fallback="relevé non transmis"
                    style={{ fontSize: 13.5 }}
                  />
                  {date !== null
                    ? " au relevé de cette route. Le pôle fonctionne — il n'y a simplement rien encore, et je préfère te le dire que remplir une grille."
                    : " avec cette route : la liste est bien vide, mais sans date de relevé je ne peux pas te dire de quand."}
                </Body>
              }
              action={
                <Button
                  tone="transforme"
                  label={ouverture ? 'Ouverture…' : 'Ouvrir le pôle sur le site'}
                  disabled={ouverture}
                  onPress={() => void ouvrirLePole()}
                />
              }
            />
          </Surface>
        ) : (
          /* ── REMPLI ───────────────────────────────────────────────────────────────── */
          <View style={{ marginTop: 10, gap: 12 }}>
            {liste.map((f) => (
              <Surface key={f.slug} level="flat" style={{ padding: 18 }}>
                <Eyebrow>
                  {f.genre === 'audio' ? 'Podcast' : 'Vidéo'}
                  {f.date ? ` · ${f.date}` : ''}
                </Eyebrow>
                <View style={{ marginTop: 8 }}>
                  <Display size="xs">{f.titre}</Display>
                </View>
                {f.resume ? <Body muted style={{ marginTop: 8, fontSize: 13.5 }}>{f.resume}</Body> : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <Icon name="clock" size={14} color={t('textMuted')} />
                  <Num
                    value={f.duree ?? null}
                    source="db"
                    asOf={date ?? new Date(0)}
                    fallback="durée non transmise"
                    style={{ fontSize: 12.5, fontWeight: '400' }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 9, marginTop: 16, flexWrap: 'wrap' }}>
                  <Button
                    tone="transforme"
                    label={f.genre === 'audio' ? 'Lire la transcription' : 'Voir la fiche'}
                    onPress={() => router.push({
                      pathname: f.genre === 'audio' ? '/episode' : '/video',
                      params: {
                        slug: f.slug,
                        titre: f.titre,
                        date: f.date ?? '',
                        duree: f.duree ?? '',
                        releve: date ? date.toISOString() : '',
                      },
                    })}
                  />
                </View>
              </Surface>
            ))}

            <Surface level="truth" style={{ padding: 18 }}>
              <Eyebrow>Pourquoi il y en a si peu</Eyebrow>
              <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
                <Num
                  value={date !== null ? liste.length : null}
                  source="db"
                  asOf={date ?? new Date(0)}
                  unit="fiches"
                  fallback="relevé non transmis"
                  style={{ fontSize: 12.5 }}
                />
                {' '}au relevé de cette route. C'est tout, et je préfère te le montrer comme
                ça plutôt que de remplir une grille. Un épisode par mois, quand j'ai quelqu'un qui
                vaut la peine d'être écouté.
              </Body>
            </Surface>
          </View>
        )}

        <Body muted style={{ marginTop: 16, fontSize: 12 }}>
          Aucun compteur d'écoute n'est affiché ici. À un épisode, un compteur ne dit rien
          d'utile — et le nombre existe pourtant dans la fiche vidéo : ne pas le montrer est
          une décision, pas un oubli.
        </Body>
      </ScrollView>
    </View>
  );
}
