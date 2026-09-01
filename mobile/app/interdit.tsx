import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, LessonRow, Mesh, Num, Surface, Tag, ThemeScope, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * /403 — CE QUE LES RÈGLES ONT DÉJÀ REFUSÉ.
 *
 * LA PHRASE QUI PORTE L'ÉCRAN : « un garde de route est du code client : il cache, il
 * n'interdit pas. » Elle n'est pas là pour faire modeste. Quelqu'un qui lit « accès refusé »
 * sur un écran d'application peut en conclure que l'application protège la donnée — et
 * décider, ailleurs, de s'appuyer là-dessus. Le vrai cloisonnement est dans `firestore.rules`,
 * côté serveur, et cette page ne fait que dire ce qu'elles ont déjà tranché.
 *
 * L'ÉCRAN DIT AUSSI CE QUE LE RÔLE ATTEINT. Un refus sans issue laisse quelqu'un devant un
 * mur ; la liste des écrans permis transforme le refus en orientation. C'est la même règle
 * que pour un état vide — « une invitation à agir, pas une excuse ».
 *
 * LE MODE NUIT EST UNE PORTÉE LOCALE, pas un thème d'application : `ThemeScope` est
 * l'équivalent natif d'un `.dk` posé sur une sous-partie de l'arbre. Le contenu est donc
 * rendu par un composant SÉPARÉ — `useToken()` lit le contexte de son parent, et l'appeler
 * dans le composant qui POSE la portée le ferait retomber sur les valeurs claires.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Interdit() {
  return (
    <ThemeScope scheme="dark">
      <Refus />
    </ThemeScope>
  );
}

function Refus() {
  const t = useToken();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { code, role, ecrans } = useLocalSearchParams<{ code?: string; role?: string; ecrans?: string }>();

  /* L'instant où le garde a conclu. Figé au montage : une date qui glisse à chaque rendu
     n'est pas une date de relevé, c'est une horloge. */
  const [lu] = useState(() => new Date());

  const permis: string[] = (() => {
    if (!ecrans) return [];
    try {
      const v: unknown = JSON.parse(ecrans);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  })();

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="nuit" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Accès</Eyebrow>

        {/* Le code est une valeur, pas un ornement : il vient du garde, et l'écran le cite
            comme tel. Un « 403 » dessiné à la main dirait la même chose sans rien prouver. */}
        <Num
          value={code ?? '403'}
          source={{ cite: 'conclusion du garde de route, côté client' }}
          asOf={lu}
          style={{ fontSize: 96, lineHeight: 100, letterSpacing: -4, color: t('ink3'), marginTop: 6 }}
        />

        <View style={{ marginTop: 2 }}>
          <Display size="sm" lines={["Cette page n'est", 'pas pour ce rôle.']} />
        </View>

        {role ? (
          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Body muted>Ton rôle est</Body>
            <Tag>{role}</Tag>
            {permis.length > 0 && (
              <Body muted>
                . Il atteint exactement{' '}
                <Num
                  value={permis.length}
                  source={{ cite: 'liste des écrans permis, transmise par le garde' }}
                  asOf={lu}
                  style={{ fontSize: 15 }}
                />
                {' '}écrans, et celui-ci n'en fait pas partie.
              </Body>
            )}
          </View>
        ) : (
          <Body muted style={{ marginTop: 14 }}>
            Le garde n'a pas transmis ton rôle à cet écran. Il n'est donc pas affiché : un rôle
            supposé sur une page de refus est la pire chose à supposer.
          </Body>
        )}

        {/* ── OÙ TU PEUX ALLER ────────────────────────────────────────────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>Ce que ton rôle atteint</Eyebrow>
        {permis.length > 0 ? (
          <Surface level="night" style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 4 }}>
            {permis.map((e, i) => (
              <LessonRow
                key={e}
                icon={<Icon name="check" size={13} color={t('mmTealT')} strokeWidth={3.4} />}
                title={e}
                last={i === permis.length - 1}
                trailing={<Icon name="forward" size={15} color={t('ink3')} strokeWidth={2.4} />}
              />
            ))}
          </Surface>
        ) : (
          <Surface level="night" style={{ marginTop: 10, padding: 18 }}>
            <Body muted style={{ fontSize: 13 }}>
              La liste des écrans permis n'est pas arrivée avec cette route. Elle n'est pas
              devinée ici : proposer une porte qui se refermerait au clic serait un deuxième
              refus, plus désagréable que le premier.
            </Body>
          </Surface>
        )}

        <Button
          tone="quiet"
          label="Revenir en arrière"
          onPress={() => router.back()}
          style={{ marginTop: 18 }}
        />

        <Surface level="night" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Ce que cette page est, exactement</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Un garde de route est du code client : il cache, il n'interdit pas. Le vrai
            cloisonnement est dans les règles de la base — cette page dit simplement ce
            qu'elles ont déjà refusé. Si quelqu'un contournait cet écran, la lecture serait
            quand même refusée, par le serveur, et sans cet écran.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
