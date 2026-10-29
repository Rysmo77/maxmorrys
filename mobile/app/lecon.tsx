import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Bandeau, Body, Button, ChipRow, Display, Eyebrow, Gradient, Heros, Icon, IconButton, LessonRow,
  Num, ProgressBar, Revele, SansDonnees, Screen, Surface, Tag, haptique, isIOS,
  useActionGradient, useBandeau, useMouvement, useToken, Ligne, Liste,
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

  const { bandeau, montrer, effacer } = useBandeau();
  const { reduit } = useMouvement();
  const defilement = useRef<ScrollView>(null);
  /* Le moment de fin : la leçon qu'on vient de cocher, le temps de proposer la suivante. */
  const [terminee, setTerminee] = useState<string | null>(null);
  /* Retirer une leçon du téléphone s'annule pendant 4 s — le geste est discret, l'erreur
     coûte un téléchargement sur un forfait compté. */
  const [retrait, setRetrait] = useState<{ cle: string; minuteur: ReturnType<typeof setTimeout> } | null>(null);
  useEffect(() => () => { if (retrait) clearTimeout(retrait.minuteur); }, [retrait]);

  /* CHANGER DE LEÇON SUR PLACE REMONTE EN HAUT. Le contenu changeait sous le doigt, et on
     arrivait au milieu de la leçon suivante, à la hauteur où l'on avait lu la précédente. */
  function ouvrir(id: string | null) {
    setLeconId(id);
    setTerminee(null);
    effacer();
    defilement.current?.scrollTo({ y: 0, animated: !reduit });
  }

  async function basculer(id: string, titre: string, suivante: boolean) {
    if (!formationId) return;
    setBascules((b) => ({ ...b, [id]: suivante }));
    if (suivante) { setTerminee(id); haptique.succes(); } else setTerminee(null);
    try {
      await marquerLecon(formationId, id, suivante, titre);
    } catch (erreur: unknown) {
      setBascules((b) => ({ ...b, [id]: !suivante }));
      setTerminee(null);
      montrer(
        'stop',
        "Ça n'a pas été enregistré",
        erreur instanceof ErreurAppel ? `${erreur.motif} Ta progression n'a pas changé.` : "Ta progression n'a pas changé.",
      );
    }
  }

  async function telecharger() {
    if (!contenu) return;
    try {
      if (gardee) {
        const cle = gardee.cle;
        if (retrait) clearTimeout(retrait.minuteur);
        setRetrait({ cle, minuteur: setTimeout(() => { setRetrait(null); void retirerLecon(cle); }, 4000) });
        return;
      }
      if (servi.phase !== 'servie') return;
      const { evincees } = await garderLecon(contenu, servi.asOf.toISOString());
      haptique.succes();
      if (evincees.length > 0) {
        montrer('info', 'Gardée sur ton téléphone', `Pour tenir sous le plafond, ${evincees.length > 1 ? 'les plus anciennes ont été retirées' : 'la plus ancienne a été retirée'} : ${evincees.map((e) => e.titre).join(', ')}.`);
      }
    } catch (e: unknown) {
      montrer('stop', "La leçon n'est pas gardée", e instanceof RefusDeGarde ? e.message : "L'écriture sur le téléphone a échoué.");
    }
  }

  function annulerRetrait() {
    if (!retrait) return;
    clearTimeout(retrait.minuteur);
    setRetrait(null);
  }

  return (
    <Screen
      territory="forme"
      /* « Cours » était faux une fois sur deux : on arrive ici depuis la fiche d'une
         formation, l'Espace ou le répétiteur. */
      retour="Retour"
      refDefilement={defilement}
      titre={isIOS ? undefined : (contenu?.moduleTitre ?? 'Leçon')}
      droite={contenu ? (
        <IconButton
          label={gardee && !retrait ? 'Retirer cette leçon du téléphone' : 'Garder cette leçon pour le hors connexion'}
          disabled={(!gardee && servi.phase !== 'servie') || retrait !== null}
          onPress={() => { void telecharger(); }}
        >
          <Icon name={gardee && !retrait ? 'check-circle' : 'download'} size={17} color={gardee && !retrait ? t('mmTealT') : t('textBody')} strokeWidth={2.2} />
        </IconButton>
      ) : undefined}
    >
      <BandeauHorsLigne />
      {bandeau}
      {retrait ? (
        <Bandeau
          ton="info"
          titre="Retirée de ce téléphone"
          corps="Elle ne se lira plus sans réseau."
          action={<Button tone="quiet" size="sm" label="Annuler" onPress={annulerRetrait} />}
          style={{ marginTop: 12 }}
        />
      ) : null}
      <Eyebrow style={{ marginTop: 6 }}>{contenu?.moduleTitre ?? 'Ta leçon'}</Eyebrow>

      {contenu === null ? (
        <SansDonnees
          quoi="cette leçon"
          origine={enEchec ? 'du serveur — et elle n\'a pas été gardée sur ce téléphone' : undefined}
          degat="Une leçon inventée est une leçon qu'on croit avoir lue."
          etat={servi}
          hauteur={6}
          style={{ marginTop: 14 }}
        />
      ) : (
        <>
          {/* Le titre tient sur DEUX lignes et rétrécit au besoin : sur une seule, les titres
              longs du catalogue tombaient à 65 % et devenaient illisibles. */}
          <Display size={26} maxLignes={2} style={{ marginTop: 8 }}>{contenu.titre}</Display>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {contenu.duree ? <Tag>{contenu.duree}</Tag> : null}
            {gardee && !retrait ? (
              <Revele echelle><Tag tone="ok">{`Sur ce téléphone · ${poids(gardee.octets)}`}</Tag></Revele>
            ) : null}
            {depuisLeTelephone && garde ? (
              <Num value={`Copie gardée · relevée le ${new Date(garde.releveA).toLocaleDateString('fr-FR')}`} source="server" asOf={new Date(garde.releveA)} style={{ fontSize: 11.5 }} />
            ) : null}
          </View>

          {contenu.type === 'video' ? (
            <Gradient colors={g.lecon} angle={140} radius={26} style={{ marginTop: 16, height: 150, alignItems: 'center', justifyContent: 'center' }}>
              {contenu.video && !depuisLeTelephone ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button tone="quiet" size="sm" label="Regarder la vidéo" onPress={() => { void openBrowserAsync(contenu.video as string); }} />
                  <Button
                    tone="quiet"
                    size="sm"
                    label="Plein écran"
                    icon="monitor"
                    onPress={() => router.push({ pathname: '/lecteur', params: { titre: contenu.titre, module: contenu.moduleTitre ?? '' } })}
                  />
                </View>
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
                <>
                  <Body muted style={{ fontSize: 14, lineHeight: 22 }}>
                    {contenu.type === 'quiz' ? 'Le quiz du module' : 'La mission de cette leçon'} — comptés par le serveur, comme sur le site.
                  </Body>
                  {/* Passe 2 (maquettes 17 et 18) : le quiz et la mission ont leur écran. */}
                  <Button
                    tone="forme"
                    size="sm"
                    label={contenu.type === 'quiz' ? 'Ouvrir le quiz' : 'Ouvrir la mission'}
                    style={{ marginTop: 12 }}
                    onPress={() => router.push({
                      pathname: contenu.type === 'quiz' ? '/quiz' : '/mission',
                      params: { titre: contenu.titre, module: contenu.moduleTitre ?? '', slug: contenu.slug ?? '' },
                    })}
                  />
                </>
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
              <Liste style={{ marginTop: 14 }}>
                {contenu.ressources.map((r) => (
                  <Ligne
                    key={r.url}
                    icone={r.type === 'link' ? 'link' : 'doc'}
                    titre={r.titre}
                    sous={[r.type.toUpperCase(), r.taille].filter(Boolean).join(' · ')}
                    droite={<Icon name="external" size={16} color={t('ink3')} strokeWidth={2.2} />}
                    onPress={() => { void openBrowserAsync(r.url); }}
                  />
                ))}
              </Liste>
            )
          ) : null}

          {/* ── LE MOMENT DE FIN ── « C'est enregistré ? Qu'est-ce que ça change ? » La coche
              apparaît, et la leçon suivante se propose à l'endroit où le doigt vient de
              toucher. Pas de confettis : le certificat porte le seul moment de fête. */}
          {terminee === contenu.id && faite ? (
            <Revele echelle>
              <Surface level="flat" style={{ marginTop: 16, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Heros>
                    <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t('ok') }}>
                      <Icon name="check" size={18} color={t('paperFixed')} strokeWidth={3} />
                    </View>
                  </Heros>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: '700' }}>Leçon terminée</Body>
                    <Body muted style={{ fontSize: 13, marginTop: 2 }}>
                      {contenu.suivante ? 'La suivante est prête.' : 'Tu as fini ce module.'}
                    </Body>
                  </View>
                </View>
                {contenu.suivante ? (
                  <Button tone="forme" label="Leçon suivante" trailing="forward" style={{ marginTop: 14 }} onPress={() => ouvrir(contenu.suivante ?? null)} />
                ) : null}
              </Surface>
            </Revele>
          ) : (
            <Button
              tone={faite ? 'quiet' : 'forme'}
              label={faite ? 'Marquer à refaire' : "J'ai terminé cette leçon"}
              icon={faite ? 'check' : undefined}
              style={{ marginTop: 16 }}
              onPress={() => { void basculer(contenu.id, contenu.titre, !faite); }}
            />
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {contenu.precedente ? <Button tone="quiet" size="sm" label="Précédente" icon="back" onPress={() => ouvrir(contenu.precedente ?? null)} /> : null}
            {contenu.suivante && terminee !== contenu.id ? <Button tone="quiet" size="sm" label="Suivante" trailing="forward" onPress={() => ouvrir(contenu.suivante ?? null)} /> : null}
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
                onPress={() => ouvrir(l.id)}
                last={i === programme.length - 1}
              />
            );
          })}
        </Surface>
      )}

      <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
        Une leçon gardée se lit sans réseau : son texte et ses ressources nommées, pas sa vidéo.
        Le poids affiché est celui qui est réellement écrit sur ton téléphone.
      </Body>
    </Screen>
  );
}
