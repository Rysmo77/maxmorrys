import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Body, Button, Display, EmptyState, Eyebrow, Icon, LessonRow, Mesh, Num, Surface, Switch, Tag, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * HORS CONNEXION — LE FORFAIT EST COMPTÉ, DONC CHAQUE POIDS EST ÉCRIT.
 *
 * Sur ce marché, le panier de données 2 Go coûte en médiane 4,2 % du revenu national brut par
 * habitant. Une leçon relue trois fois se paie trois fois. C'est le seul argument
 * d'installation qui vaille pour cette application, et il ne se défend pas par une promesse
 * mais par un chiffre : le poids de CHAQUE ressource, en monospace, sur sa ligne.
 *
 * L'INTERRUPTEUR « WI-FI SEULEMENT » EST À CÔTÉ DES POIDS, pas dans un écran de réglages :
 * c'est ici qu'on se demande ce que ça coûte, donc ici qu'on décide ce qu'on autorise.
 *
 * LA FILE D'ATTENTE EST MONTRÉE, ET C'EST LE POINT. Quelqu'un qui a terminé une leçon sans
 * réseau doit voir que son geste n'est pas perdu — sinon il le refait, ou il abandonne. Le
 * parcours survit à une session interrompue et reprise des jours plus tard.
 *
 * RIEN N'EST INVENTÉ ICI. Le catalogue hors connexion est tenu par l'APPAREIL ; ce port
 * n'écrit pas encore ce manifeste, donc l'écran le reçoit par la route ou n'affiche rien.
 * Et quand il n'y a rien : un vide DATÉ, qui est une information, avec une sortie — jamais
 * un tiret, qui n'en est pas une.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
type Ressource = { titre: string; genre?: string; octets?: number; pret?: boolean };
type EnFile = { titre: string; depuis?: string };

/** Un paramètre de route est une chaîne. Illisible, il vaut absent — jamais deviné. */
function lire<T>(brut: string | undefined): T[] {
  if (!brut) return [];
  try {
    const v: unknown = JSON.parse(brut);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

const MO = 1024 * 1024;

export default function HorsConnexion() {
  const t = useToken();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ressources, file, releve } = useLocalSearchParams<{
    ressources?: string; file?: string; releve?: string;
  }>();

  const [wifi, setWifi] = useState(true);

  const gardees = lire<Ressource>(ressources);
  const attente = lire<EnFile>(file);
  const brut = releve ? new Date(releve) : null;
  const date = brut !== null && !Number.isNaN(brut.getTime()) ? brut : null;
  // Le manifeste est écrit par l'appareil : c'est lui la source, pas le serveur.
  const source = { cite: "manifeste de téléchargement de cet appareil" } as const;

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="informe" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>État du réseau</Eyebrow>
          <Tag tone="stop">Hors connexion</Tag>
        </View>

        <View style={{ marginTop: 10 }}>
          <Display size="sm" lines={['Pas de réseau.']} />
        </View>

        <Body muted style={{ marginTop: 11 }}>
          Tu peux continuer les{' '}
          <Num
            value={date !== null ? gardees.length : null}
            source={source}
            asOf={date ?? new Date(0)}
            fallback="ressources"
            style={{ fontSize: 15 }}
          />
          {' '}leçons déjà téléchargées. Ta progression partira dès que tu retrouves du réseau.
        </Body>

        {/* ── CE QUI EST LÀ, AVEC SON POIDS ───────────────────────────────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>Disponible sans réseau</Eyebrow>
        {gardees.length > 0 ? (
          <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 6 }}>
            {gardees.map((r, i) => (
              <LessonRow
                key={`${r.titre}-${i}`}
                state={r.pret === false ? 'todo' : 'done'}
                title={r.titre}
                meta={r.genre}
                last={i === gardees.length - 1}
                trailing={
                  <Num
                    // Le poids est celui que l'appareil a MESURÉ en écrivant le fichier.
                    // Absent, il ne s'estime pas : « poids non transmis » est plus utile
                    // qu'un « environ 4 Mo » sur lequel personne ne peut décider.
                    value={typeof r.octets === 'number' ? `${(r.octets / MO).toFixed(1).replace('.', ',')} Mo` : null}
                    source={source}
                    asOf={date ?? new Date(0)}
                    fallback="poids non transmis"
                    style={{ fontSize: 13 }}
                  />
                }
              />
            ))}
          </Surface>
        ) : (
          <Surface level="flat" style={{ marginTop: 10, padding: 6 }}>
            <EmptyState
              glyph={<Icon name="download" size={26} color={t('mmOrangeT')} />}
              title="Rien n'est gardé sur cet appareil."
              body={
                <Body muted style={{ fontSize: 13.5, textAlign: 'center' }}>
                  <Num
                    value={date !== null ? 0 : null}
                    source={source}
                    asOf={date ?? new Date(0)}
                    unit="ressource"
                    fallback="manifeste non lu"
                    style={{ fontSize: 13.5 }}
                  />
                  {date !== null
                    ? " téléchargée à ce jour. Garde une leçon avant de partir : c'est le geste qui rend cette application utile ici."
                    : " par cet écran. Le manifeste est tenu par l'appareil, et ce port ne l'écrit pas encore."}
                </Body>
              }
              action={<Button tone="informe" label="Voir mes cours" onPress={() => router.push('/cours')} />}
            />
          </Surface>
        )}

        {/* ── CE QUE TU AUTORISES ─────────────────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 14, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '600', fontSize: 14 }}>Télécharger en Wi-Fi seulement</Body>
              <Body muted style={{ marginTop: 2, fontSize: 12 }}>Pour ne pas entamer ton forfait.</Body>
            </View>
            <Switch on={wifi} label="Télécharger en Wi-Fi seulement" onPress={() => setWifi((v) => !v)} />
          </View>
          <Body muted style={{ marginTop: 12, fontSize: 12 }}>
            Ce port n'a pas encore de gestionnaire de téléchargement à qui donner cet ordre :
            le réglage tient le temps de la session. Il est ici parce que c'est ici qu'on se
            pose la question, pas parce qu'il commande déjà quelque chose.
          </Body>
        </Surface>

        {/* ── CE QUI ATTEND DE PARTIR ─────────────────────────────────────────────────── */}
        <Eyebrow style={{ marginTop: 22 }}>En attente d'envoi</Eyebrow>
        {attente.length > 0 ? (
          <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 6 }}>
            {attente.map((e, i) => (
              <LessonRow
                key={`${e.titre}-${i}`}
                icon={<Icon name="upload" size={13} color={t('warn')} />}
                title={e.titre}
                meta={e.depuis}
                trailing={<Tag tone="warn">en file</Tag>}
                last={i === attente.length - 1}
              />
            ))}
          </Surface>
        ) : (
          <Surface level="flat" style={{ marginTop: 10, padding: 18 }}>
            <Body muted style={{ fontSize: 13 }}>
              <Num
                value={date !== null ? 0 : null}
                source={source}
                asOf={date ?? new Date(0)}
                unit="geste"
                fallback="file non lue"
                style={{ fontSize: 13 }}
              />
              {date !== null
                ? " en attente : tout ce que tu as fait est déjà arrivé."
                : " par cet écran — la file vit sur l'appareil, et ce port ne la lit pas encore."}
            </Body>
          </Surface>
        )}

        <Body muted style={{ marginTop: 14, fontSize: 12 }}>
          Le parcours survit à une session interrompue et reprise des jours plus tard : la file
          part au retour du réseau, sans rien te demander.
        </Body>
      </ScrollView>
    </View>
  );
}
