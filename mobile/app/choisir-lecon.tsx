import { router } from 'expo-router';
import {
  Body, Display, Eyebrow, Ligne, Liste, Rubrique, SansDonnees, Screen, isIOS,
} from '../ds';
import { useEspace, useLecon } from '../donnees';

/**
 * ══ 37 · SUR QUOI PORTE TA QUESTION ? ══ (maquette Rysmo-iOS-37, feuille sur l'assistant).
 *
 * La liste vient du PROGRAMME réel de la formation en cours (`appLecon`) : ce qui est vu, en
 * cours, à venir. Choisir une leçon ramène à l'assistant avec la question déjà amorcée sur elle.
 * « Une question de business hors leçon » ramène sans amorce. Les conversations passées de la
 * maquette (fond de la feuille) n'ont pas de source : elles ne sont pas affichées.
 */
export default function ChoisirLecon() {
  const espace = useEspace();
  const lecon = useLecon(espace.valeur?.formationId);
  const programme = lecon.valeur?.programme ?? [];

  function choisir(sujet: string | null) {
    router.navigate(sujet ? { pathname: '/repetiteur', params: { sujet } } : '/repetiteur');
  }

  return (
    <Screen espace="ia" territory="transforme" retour="Assistant" titre={isIOS ? undefined : 'Choisir la leçon'}>
      <Display size={24} lines={['Sur quoi porte', 'ta question ?']} style={{ marginTop: 6 }} />
      <Liste style={{ marginTop: 16 }}>
        <Ligne
          icone="store"
          titre="Une question de business hors leçon"
          sous="ton commerce, tes clients, tes prix"
          onPress={() => choisir(null)}
        />
      </Liste>

      <Rubrique>{espace.valeur ? `${espace.valeur.titreCourt} · en cours` : 'Ta formation en cours'}</Rubrique>
      {programme.length === 0 ? (
        <SansDonnees
          quoi="le programme de ta formation"
          degat="Une leçon proposée ici sans exister orienterait ta question vers un cours que tu n'as pas."
          etat={espace.valeur ? lecon : espace}
          hauteur={4}
        />
      ) : (
        <Liste>
          {programme.map((l) => (
            <Ligne
              key={l.id}
              icone={l.etat === 'done' ? 'check' : l.etat === 'current' ? 'play' : 'clock'}
              titre={l.titre}
              sous={[l.meta, l.etat === 'done' ? 'vue' : l.etat === 'current' ? 'en cours' : 'à venir'].filter(Boolean).join(' · ')}
              onPress={() => choisir(l.titre)}
            />
          ))}
        </Liste>
      )}
      <Eyebrow style={{ marginTop: 18 }}>Pourquoi choisir</Eyebrow>
      <Body muted style={{ marginTop: 6, fontSize: 13, lineHeight: 19 }}>
        L'assistant répond mieux quand il sait de quelle leçon tu parles : il te renvoie vers elle
        quand la réponse y est.
      </Body>
    </Screen>
  );
}
