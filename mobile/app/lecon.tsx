import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, ChipRow, Display, Eyebrow, Gradient, Icon, IconButton, LessonRow, Num, ProgressBar, SansDonnees, Screen, Surface, Tag, isIOS, useActionGradient, useToken,
} from '../ds';
import { ErreurAppel, marquerLecon, provenance, useEspace, useLecon, useLeconContenu } from '../donnees';
import type { LeconContenu } from '../donnees/contrat.generated';
import { RefusDeGarde, garderLecon, lireLeconGardee, retirerLecon, useHorsLigne } from '../donnees/hors-ligne';
import { cleDeLecon, poids } from '../donnees/garde';
import { BandeauHorsLigne } from '../ecrans/BandeauHorsLigne';
import { TexteDeLecon } from '../ecrans/TexteDeLecon';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ LA LEÇON ══ — ENFIN BRANCHÉE, ET LISIBLE SANS RÉSEAU UNE FOIS GARDÉE.
 *
 * ⛔ CET ÉCRAN N'AVAIT AUCUN CONTENU. Son titre était écrit en dur (« Les mots que tapent tes
 * clients »), le lecteur était débranché, la transcription et la ressource étaient des
 * exemples, et le bouton de téléchargement était éteint. Il lit maintenant `appLeconContenu`.
 *
 * HORS CONNEXION : si la lecture échoue et que la leçon a été GARDÉE, c'est la copie du
 * téléphone qui s'affiche — avec la date à laquelle elle a été relevée. Une leçon jamais
 * gardée le dit, au lieu de faire semblant.
 *
 * LA VIDÉO NE SE GARDE PAS : c'est une intégration (`iframe` sur le site), pas un fichier.
 * Elle s'ouvre dans le navigateur quand il y a du réseau, et l'écran le dit quand il n'y en a
 * pas. « Transcription » a disparu des onglets : aucune donnée ne la porte.
 *
 * COCHER une leçon part tout de suite ; hors réseau, la coche RESTE et part au retour
 * (`hors-ligne.ts`). Le programme sert à NAVIGUER : toucher une ligne ouvre la leçon.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const VUES = ['Leçon', 'Ressources', 'Mes notes'] as const;

export default function Lecon() {
  const t = useToken();
  const g = useActionGradient();
  const p = useLocalSearchParams<{ formationId?: string; leconId?: string }>();
  const espace = useEspace();
  const formationId = (Array.isArray(p.formationId) ? p.formationId[0] : p.formationId) ?? espace.valeur?.formationId ?? null;
  const [leconId, setLeconId] = useState<string | null>((Array.isArray(p.leconId) ? p.leconId[0] : p.leconId) ?? null);
  const lecon = useLecon(formationId ?? undefined);
  const servi = useLeconContenu(formationId, leconId);
  const { gardees } = useHorsLigne();
  const programme = lecon.valeur?.programme ?? [];
  const [bascules, setBascules] = useState<Record<string, boolean>>({});
  const [vue, setVue] = useState<string>('Leçon');
  const [garde, setGarde] = useState<{ contenu: LeconContenu; releveA: string } | null>(null);

  /* La copie du téléphone, lue quand le serveur ne répond pas. Sans leçon désignée, la plus
     récemment gardée de cette formation — c'est celle qu'on a le plus de chances de reprendre. */
  const enEchec = servi.phase === 'panne';
  useEffect(() => {
    if (!enEchec || !formationId) { setGarde(null); return; }
    const cible = leconId ?? [...gardees].filter((x) => x.formationId === formationId)
      .sort((a, b) => b.gardeeLe.localeCompare(a.gardeeLe))[0]?.leconId;
    if (!cible) { setGarde(null); return; }
    let vivant = true;
    void lireLeconGardee(formationId, cible).then((c) => { if (vivant) setGarde(c); });
    return () => { vivant = false; };
  }, [enEchec, formationId, leconId, gardees]);

  const contenu: LeconContenu | null = servi.valeur ?? garde?.contenu ?? null;
  const depuisLeTelephone = servi.valeur === null && garde !== null;
  const gardee = contenu ? gardees.find((x) => x.cle === cleDeLecon(contenu.formationId, contenu.id)) : undefined;
  const faite = contenu ? (bascules[contenu.id] ?? contenu.faite) : false;

  async function basculer(id: string, titre: string, suivante: boolean) {
    if (!formationId) return;
    setBascules((b) => ({ ...b, [id]: suivante }));
    try {
      await marquerLecon(formationId, id, suivante, titre);
    } catch (erreur: unknown) {
      setBascules((b) => ({ ...b, [id]: !suivante }));
      Alert.alert(
        "Ça n'a pas été enregistré",
        erreur instanceof ErreurAppel ? `${erreur.motif} Ta progression n'a pas changé.` : "Ta progression n'a pas changé.",
      );
    }
  }

  async function telecharger() {
    if (!contenu) return;
    try {
      if (gardee) { await retirerLecon(gardee.cle); return; }
      if (servi.phase !== 'servie') return;
      const { evincees } = await garderLecon(contenu, servi.asOf.toISOString());
      if (evincees.length > 0) {
        Alert.alert('Gardée sur ton téléphone', `Pour tenir sous le plafond, ${evincees.length > 1 ? 'les plus anciennes ont été retirées' : 'la plus ancienne a été retirée'} : ${evincees.map((e) => e.titre).join(', ')}.`);
      }
    } catch (e: unknown) {
      Alert.alert("La leçon n'est pas gardée", e instanceof RefusDeGarde ? e.message : "L'écriture sur le téléphone a échoué.");
    }
  }

  return (
    <Screen
      territory="forme"
      tabbar
      retour="Cours"
      titre={isIOS ? undefined : (contenu?.moduleTitre ?? 'Leçon')}
      droite={contenu ? (
        <IconButton
          label={gardee ? 'Retirer cette leçon du téléphone' : 'Garder cette leçon pour le hors connexion'}
          disabled={!gardee && servi.phase !== 'servie'}
          onPress={() => { void telecharger(); }}
        >
          <Icon name={gardee ? 'check-circle' : 'download'} size={17} color={gardee ? t('mmTealT') : t('textBody')} strokeWidth={2.2} />
        </IconButton>
      ) : undefined}
    >
      <BandeauHorsLigne />
      <Eyebrow style={{ marginTop: 6 }}>{contenu?.moduleTitre ?? 'Ta leçon'}</Eyebrow>

      {contenu === null ? (
        <SansDonnees
          quoi="cette leçon"
          origine={enEchec ? 'du serveur — et elle n\'a pas été gardée sur ce téléphone' : undefined}
          degat="Une leçon inventée est une leçon qu'on croit avoir lue."
          etat={enEchec ? undefined : servi}
          hauteur={6}
          style={{ marginTop: 14 }}
        />
      ) : (
        <>
          <Display size={26} lines={[contenu.titre]} style={{ marginTop: 8 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {contenu.duree ? <Tag>{contenu.duree}</Tag> : null}
            {gardee ? <Tag tone="ok">{`Sur ce téléphone · ${poids(gardee.octets)}`}</Tag> : null}
            {depuisLeTelephone && garde ? (
              <Num value={`Copie gardée · relevée le ${new Date(garde.releveA).toLocaleDateString('fr-FR')}`} source="server" asOf={new Date(garde.releveA)} style={{ fontSize: 11.5 }} />
            ) : null}
          </View>

          {contenu.type === 'video' ? (
            <Gradient colors={g.lecon} angle={140} radius={26} style={{ marginTop: 16, height: 150, alignItems: 'center', justifyContent: 'center' }}>
              {contenu.video && !depuisLeTelephone ? (
                <Button tone="quiet" size="sm" label="Regarder la vidéo" onPress={() => { void openBrowserAsync(contenu.video as string); }} />
              ) : (
                <Body style={{ color: t('paperFixed'), fontSize: 13, textAlign: 'center', paddingHorizontal: 20 }}>
                  {contenu.video ? 'La vidéo demande du réseau : elle ne se garde pas sur le téléphone. Le texte, si.' : "La vidéo de cette leçon n'est pas encore en ligne."}
                </Body>
              )}
            </Gradient>
          ) : null}

          <ChipRow
            options={VUES}
            value={vue}
            onChange={(v) => { if (v === 'Mes notes') router.push('/notes'); else setVue(v); }}
            style={{ marginTop: 16 }}
          />

          {vue === 'Leçon' ? (
            <Surface level="flat" style={{ marginTop: 14, padding: 18 }}>
              {contenu.type === 'quiz' || contenu.type === 'mission' ? (
                <Body muted style={{ fontSize: 14, lineHeight: 22 }}>
                  {contenu.type === 'quiz' ? 'Ce quiz' : 'Cette mission'} se fait sur le site, où tes réponses sont comptées.
                </Body>
              ) : contenu.contenu ? (
                <TexteDeLecon contenu={contenu.contenu} />
              ) : (
                <Body muted style={{ fontSize: 14 }}>Cette leçon n'a pas de texte.</Body>
              )}
            </Surface>
          ) : null}

          {vue === 'Ressources' ? (
            contenu.ressources.length === 0 ? (
              <Body muted style={{ marginTop: 14, fontSize: 13.5 }}>Aucune ressource pour cette leçon.</Body>
            ) : (
              <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
                {contenu.ressources.map((r, i) => (
                  <LessonRow
                    key={r.url}
                    icon={<Icon name={r.type === 'link' ? 'link' : 'doc'} size={14} color={t('ink2')} />}
                    title={r.titre}
                    meta={[r.type.toUpperCase(), r.taille].filter(Boolean).join(' · ')}
                    trailing={<Icon name="external" size={16} color={t('ink3')} strokeWidth={2.2} />}
                    onPress={() => { void openBrowserAsync(r.url); }}
                    last={i === contenu.ressources.length - 1}
                  />
                ))}
              </Surface>
            )
          ) : null}

          <Button
            tone={faite ? 'quiet' : 'forme'}
            label={faite ? 'Marquer à refaire' : "J'ai terminé cette leçon"}
            style={{ marginTop: 16 }}
            onPress={() => { void basculer(contenu.id, contenu.titre, !faite); }}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {contenu.precedente ? <Button tone="quiet" size="sm" label="Précédente" onPress={() => setLeconId(contenu.precedente ?? null)} /> : null}
            {contenu.suivante ? <Button tone="quiet" size="sm" label="Suivante" onPress={() => setLeconId(contenu.suivante ?? null)} /> : null}
          </View>
        </>
      )}

      {/* ── LE PROGRAMME ─────────────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 22 }}>
        <Eyebrow>Le programme</Eyebrow>
        <Num value={espace.valeur ? `${espace.valeur.progression} %` : null} {...provenance(espace)} fallback="non relevée" style={{ fontSize: 12.5, color: t('textMuted') }} />
      </View>
      {espace.valeur ? <ProgressBar value={espace.valeur.progression} style={{ marginTop: 8 }} /> : null}

      {programme.length === 0 ? (
        <SansDonnees
          quoi="le programme de ce module"
          degat="Une leçon inventée est une leçon qu'on croit avoir à regarder."
          etat={lecon}
          hauteur={5}
          style={{ marginTop: 14 }}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 14, paddingHorizontal: 16 }}>
          {programme.map((l, i) => {
            const etatLigne = bascules[l.id] === undefined ? l.etat : bascules[l.id] ? 'done' : 'todo';
            const surTelephone = formationId ? gardees.some((x) => x.cle === cleDeLecon(formationId, l.id)) : false;
            return (
              <LessonRow
                key={l.id}
                state={etatLigne}
                icon={l.id === contenu?.id ? <Icon name="play" size={13} color={t('paperFixed')} /> : l.doc ? <Icon name="doc" size={13} color={t('ink2')} /> : undefined}
                iconBackground={l.id === contenu?.id ? t('mmBleu') : undefined}
                title={l.titre}
                meta={[l.meta, surTelephone ? 'sur ce téléphone' : null].filter(Boolean).join(' · ') || undefined}
                onPress={() => setLeconId(l.id)}
                last={i === programme.length - 1}
              />
            );
          })}
        </Surface>
      )}

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12, color: t('textFaint') }}>
        Une leçon gardée se lit sans réseau : son texte et ses ressources nommées, pas sa vidéo.
        Le poids affiché est celui qui est réellement écrit sur ton téléphone.
      </Body>
    </Screen>
  );
}
