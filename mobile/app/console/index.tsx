import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Eyebrow, Icon, LessonRow, Num, Pipeline, SansDonnees, StatTile, Surface, useToken, veil,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { provenance, useConsole } from '../../donnees';
import { SUPPORT_PORTEE } from '../../contenu/portee';
import { useState } from 'react';

/**
 * ══ 6 · LA CONSOLE, RÔLE SUPPORT ══ — L'ÉCRAN D'ENTRÉE DES CINQ.
 *
 * IL RÉPOND À UNE SEULE QUESTION : **qu'est-ce qu'il y a à traiter maintenant ?** Tout ce qui
 * n'y répond pas est ailleurs. Les deux cases de tête portent leur date de relevé, comme
 * partout — un tableau de bord dont les chiffres n'ont pas de date est un tableau de bord
 * qu'on finit par ne plus croire.
 *
 * LE ZÉRO S'AFFICHE. « 0 message depuis l'origine » est une information : elle dit que le
 * canal marche et que personne n'a écrit. « — » ne dirait ni l'un ni l'autre.
 */
export default function Console() {
  const t = useToken();
  const [etape, setEtape] = useState('à traiter');

  /* Sans relevé, on ne compte pas : le filtre affiche ses étapes sans nombre plutôt qu'un
     zéro qu'on n'a pas mesuré. « Rien à traiter » et « je ne sais pas » ne se disent pas
     pareil, et c'est toute la différence sur une console de support. */
  const console = useConsole();
  const comptes = console.valeur?.comptes ?? null;
  const prospect = console.valeur?.prospect ?? null;
  const compte = (titre: string) => comptes?.[titre] ?? null;
  const aTraiter = comptes === null
    ? null
    : SUPPORT_PORTEE.reduce((n, e) => n + (comptes[e.titre] ?? 0), 0);

  return (
    <ConsoleScreen
      titre="Console · support"
      sourcil="Rôle support · 5 écrans sur 19"
      lignes={['À traiter', "aujourd’hui."]}
    >
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <StatTile
          label="Prospects"
          value={compte('Prospects')}
          {...provenance(console)}
          foot="non qualifié"
          style={{ flex: 1 }}
        />
        <StatTile
          label="Messages"
          value={compte('Messages')}
          {...provenance(console)}
          foot="depuis l'origine"
          style={{ flex: 1 }}
        />
      </View>

      <Pipeline
        stages={aTraiter === null
          ? ['tout', 'à traiter', 'clos']
          : [`tout ${aTraiter}`, `à traiter ${aTraiter}`, 'clos 0']}
        active={etape}
        onSelect={setEtape}
        style={{ marginTop: 14 }}
      />

      {/* UNE SEULE ACTION PAR LIGNE. Deux boutons sur 44 px, c'est une erreur par jour. */}
      {prospect === null ? (
        <SansDonnees
          quoi="ce qu'il y a à traiter"
          origine="du serveur"
          degat="Une demande inventée ferait rappeler quelqu'un qui n'a rien demandé, et masquerait qu'il n'y a rien à faire."
          style={{ marginTop: 14 }}
        />
      ) : (
        <Surface level="night" style={{ marginTop: 14, paddingHorizontal: 16 }}>
          <LessonRow
            icon={<Icon name="case" size={14} color={t('mmOrange')} />}
            iconBackground={veil(t('mmOrange'), 0.2)}
            title={prospect.titre}
            meta={prospect.meta}
            trailing={<Button tone="quiet" size="sm" label="Qualifier" onPress={() => router.push('/console/prospects')} />}
            last
          />
        </Surface>
      )}

      <Eyebrow style={{ marginTop: 24 }}>Ce que ton rôle atteint</Eyebrow>
      <Surface level="night" style={{ marginTop: 10, paddingHorizontal: 16 }}>
        {SUPPORT_PORTEE.map((e, i) => (
          <LessonRow
            key={e.titre}
            icon={<Icon name="check" size={13} color={t('mmTeal')} strokeWidth={3.4} />}
            iconBackground={veil(t('mmTeal'), 0.18)}
            title={e.titre}
            trailing={(
              <Num
                value={compte(e.titre)}
                {...provenance(console)}
                fallback="—"
                style={{ fontSize: 12.5, color: t('textMuted') }}
              />
            )}
            onPress={() => router.push(e.href)}
            last={i === SUPPORT_PORTEE.length - 1}
          />
        ))}
      </Surface>

      <Button
        tone="quiet"
        label="Voir ce que le rôle n'atteint pas"
        style={{ marginTop: 14 }}
        onPress={() => router.push('/interdit')}
      />

      <PiedDePortee quoi="Cet écran ne montre que ce qui attend une action." />

      <Body muted style={{ fontSize: 11.5, lineHeight: 18, marginTop: 12 }}>
        Un garde de route est du code client : il cache, il n'interdit pas. Le vrai
        cloisonnement est dans les règles de la base.
      </Body>
    </ConsoleScreen>
  );
}
