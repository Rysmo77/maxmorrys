import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, ChipRow, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, Num, ProgressBar, SansDonnees, Screen, Surface, isIOS, useActionGradient, useToken, veil,
} from '../ds';
import { provenance, useEspace, useLecon } from '../donnees';
import { useState } from 'react';

/**
 * ══ 4 · LE LECTEUR DE LEÇON ══
 *
 * FAUX VERRE PARTOUT, PARCE QUE TOUT DÉFILE. C'est la règle 1 dans sa forme la plus simple :
 * la seule surface qui a droit au flou est celle qui NE BOUGE PAS avec le contenu, et il n'y
 * en a aucune ici — la barre d'onglets, qui est du chrome fixe, est rendue par le routeur.
 *
 * LE POIDS DE CHAQUE LEÇON EST AFFICHÉ, en monospace, dans sa méta. Ce n'est pas un détail
 * d'ingénieur : sur le marché visé, le forfait est compté, et « 12 Mo » décide de regarder
 * maintenant ou d'attendre le Wi-Fi. Le téléchargement se fait donc en Wi-Fi par défaut, et
 * l'écran le dit plutôt que de le supposer.
 *
 * LE BOUTON PLEIN ÉCRAN EST L'ENTRÉE DU SEUL ÉCRAN PAYSAGE DU PRODUIT.
 */
const VUES = ['Vidéo', 'Transcription', 'Mes notes', 'Ressources'] as const;

export default function Lecon() {
  const t = useToken();
  const g = useActionGradient();
  const lecon = useLecon();
  const espace = useEspace();
  const programme = lecon.valeur?.programme ?? [];
  const [vue, setVue] = useState<string>('Vidéo');

  function ouvrirLaVue(v: string) {
    /* « Mes notes » est un ÉCRAN, pas un panneau : les notes survivent à la leçon et se
       cherchent d'un cours à l'autre. Les trois autres vues restent ici. */
    if (v === 'Mes notes') { router.push('/notes'); return; }
    setVue(v);
  }

  return (
    <Screen
      territory="forme"
      tabbar
      retour="Cours"
      titre={isIOS ? undefined : (lecon.valeur?.moduleTitre ?? 'Leçon')}
      droite={
        <IconButton label="Télécharger cette leçon">
          <Icon name="download" size={17} color={t('textBody')} strokeWidth={2.2} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>{lecon.valeur?.moduleTitre ?? 'Ta leçon'}</Eyebrow>
      <Display size={26} lines={['Les mots que', 'tapent tes clients']} style={{ marginTop: 8 }} />

      {/* ── LE LECTEUR ─────────────────────────────────────────────────────────────────── */}
      <Gradient
        colors={g.lecon}
        angle={140}
        radius={26}
        style={{
          marginTop: 16, height: 178, alignItems: 'center', justifyContent: 'center',
          shadowColor: t('mmBleu'), shadowOpacity: 0.24, shadowRadius: 17,
          shadowOffset: { width: 0, height: 14 }, elevation: 6,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lire la leçon"
          style={({ pressed }: { pressed: boolean }) => ({
            width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center',
            backgroundColor: t('paperFixed'),
            transform: [{ scale: pressed ? 0.94 : 1 }],
          })}
        >
          <Icon name="play" size={21} color={t('inkFixed')} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Passer en plein écran"
          onPress={() => router.push('/plein-ecran')}
          style={{
            position: 'absolute', right: 12, top: 12,
            width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
            backgroundColor: t('surfaceNight'),
          }}
        >
          <Icon name="forward" size={16} color={t('paperFixed')} strokeWidth={2.4} />
        </Pressable>

        <View style={{
          position: 'absolute', left: 14, right: 14, bottom: 13,
          flexDirection: 'row', alignItems: 'center', gap: 9,
        }}>
          {/* ⚠️ LE LECTEUR N'EST PAS BRANCHÉ, et ces deux horodatages sont des repères de
              maquette. Ils passaient par `<Num>` avec une source citée — c'est-à-dire qu'ils
              se présentaient comme des valeurs relevées. `<Num>` existe précisément pour
              interdire ça. Du texte reste du texte tant qu'`expo-audio` n'est pas là. */}
          <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10.5, color: t('paperFixed') }}>03:12</Body>
          {/* La piste est un VOILE DE BLANC, pas `fill4` : sur un aplat de marque, l'échelle
              de remplissage neutre est une encre SOMBRE en mode clair — elle disparaîtrait. */}
          <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: veil(t('paperFixed'), 0.34) }}>
            <View style={{ width: '38%', height: '100%', borderRadius: 2, backgroundColor: t('paperFixed') }} />
          </View>
          <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 10.5, color: t('paperFixed') }}>08:24</Body>
        </View>
      </Gradient>

      <ChipRow options={VUES} value={vue} onChange={ouvrirLaVue} height={36} style={{ marginTop: 16 }} />

      {vue === 'Transcription' ? (
        <Surface level="flat" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>La transcription</Eyebrow>
          <Body muted style={{ marginTop: 8, lineHeight: 24 }}>
            Elle est déjà sur ton téléphone : elle se lit sans charger la vidéo, et elle reste
            lisible quand le réseau lâche au milieu. C'est elle qui rend une coupure supportable.
          </Body>
          {/* « 0 Mo » est une PROPRIÉTÉ de la transcription, pas une mesure : elle est déjà
              sur l'appareil, donc il n'y a rien à charger. Aucune date n'a de sens ici. */}
          <Body style={{ fontFamily: 'JetBrainsMono', fontSize: 13, marginTop: 12 }}>0 Mo à charger</Body>
        </Surface>
      ) : null}

      {vue === 'Ressources' ? (
        <Surface level="flat" style={{ marginTop: 16, paddingHorizontal: 16 }}>
          <LessonRow
            icon={<Icon name="doc" size={14} color={t('ink2')} />}
            title="Exercice : ta liste de 20 mots"
            meta="PDF · 180 Ko"
            trailing={<Icon name="download" size={16} color={t('ink3')} strokeWidth={2.2} />}
            last
          />
        </Surface>
      ) : null}

      {/* ── LE PROGRAMME ───────────────────────────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 12, marginTop: 22,
      }}>
        <Eyebrow>Le programme</Eyebrow>
        <Num
          value={espace.valeur ? `${espace.valeur.progression} %` : null}
          {...provenance(espace)}
          fallback="non relevée"
          style={{ fontSize: 12.5, color: t('textMuted') }}
        />
      </View>
      {/* Une barre à zéro qu'on n'a pas mesurée se lit comme une progression perdue. */}
      {espace.valeur ? <ProgressBar value={espace.valeur.progression} style={{ marginTop: 8 }} /> : null}

      {programme.length === 0 ? (
        <SansDonnees
          quoi="le programme de ce module"
          degat="Une leçon inventée est une leçon qu'on croit avoir à regarder — et son poids en mégaoctets déciderait de charger ou pas."
          etat={lecon}
          hauteur={5}
          style={{ marginTop: 14 }}
        />
      ) : (
      <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
        {programme.map((l, i) => (
          <LessonRow
            key={l.id}
            state={l.etat}
            icon={
              l.etat === 'current' ? <Icon name="play" size={13} color={t('paperFixed')} />
                : l.doc ? <Icon name="doc" size={13} color={t('ink2')} />
                  : undefined
            }
            iconBackground={l.etat === 'current' ? t('mmBleu') : undefined}
            title={l.titre}
            meta={l.meta ?? undefined}
            last={i === programme.length - 1}
          />
        ))}
      </Surface>
      )}

      {/* ⚠️ CETTE PHRASE PROMETTAIT « CHAQUE POIDS ». Le serveur ne renvoie la taille que
          lorsqu'il la connaît — un poids inventé déciderait à la place de quelqu'un de
          charger maintenant ou d'attendre le Wi-Fi, sur un forfait compté. La promesse est
          donc devenue conditionnelle, comme les données. */}
      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
        Les poids sont affichés quand ils sont connus, parce que le forfait est compté. Le
        téléchargement se fait en Wi-Fi par défaut.
      </Body>
    </Screen>
  );
}
