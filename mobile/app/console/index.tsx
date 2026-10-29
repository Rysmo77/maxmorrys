import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Num, Pipeline, SansDonnees, StatTile, useToken, Ligne, Liste, Rubrique,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { provenance, useConsole } from '../../donnees';
import { SUPPORT_PORTEE } from '../../contenu/portee';
import { PORTEE_RESUMEE, type LibellePortee } from '../../contenu/termes';
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
  const compte = (titre: LibellePortee) => comptes?.[titre] ?? null;
  const aTraiter = comptes === null
    ? null
    : SUPPORT_PORTEE.reduce((n, e) => n + (comptes[e.titre] ?? 0), 0);

  return (
    <ConsoleScreen
      titre="Console · support"
      sourcil={`Rôle support · ${PORTEE_RESUMEE}`}
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
          style={{ marginTop: 14 }}
        />
      ) : (
        <Liste style={{ marginTop: 14 }}>
          <Ligne
            icone="case"
            fondIcone={t('mmOrange')}
            titre={prospect.titre}
            sous={prospect.meta}
            droite={<Button tone="quiet" size="sm" label="Qualifier" onPress={() => router.push('/console/prospects')} />}
          />
        </Liste>
      )}

      <Rubrique>Ce que ton rôle atteint</Rubrique>
      <Liste>
        {SUPPORT_PORTEE.map((e) => (
          <Ligne
            key={e.titre}
            icone="check"
            fondIcone={t('mmTeal')}
            titre={e.titre}
            droite={(
              <Num
                value={compte(e.titre)}
                {...provenance(console)}
                fallback="—"
                style={{ fontSize: 12.5, color: t('textMuted') }}
              />
            )}
            onPress={() => router.push(e.href)}
          />
        ))}
      </Liste>

      {/* Passe 2 (maquettes 51 à 53) : les trois écrans de la console mobile. */}
      <Rubrique>Sur téléphone</Rubrique>
      <Liste>
        <Ligne icone="shield" titre="Club · modération" sous="les signalements à trancher" onPress={() => router.push('/console/moderation')} />
        <Ligne icone="card" titre="Transactions" sous="lecture seule" onPress={() => router.push('/console/transactions')} />
        <Ligne icone="user" titre="Un compte" sous="rôle, accès, quota, traces" onPress={() => router.push('/console/compte')} />
      </Liste>

      <Button
        tone="quiet"
        label="Voir ce que le rôle n'atteint pas"
        style={{ marginTop: 14 }}
        onPress={() => router.push('/interdit')}
      />

      <PiedDePortee quoi="Cet écran ne montre que ce qui attend une action." />

    </ConsoleScreen>
  );
}
