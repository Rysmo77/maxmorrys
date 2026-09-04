import { useState } from 'react';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Body, Button, EmptyState, Eyebrow, Icon, Num, Pipeline, Surface, useToken, veil,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { RELEVE, SOURCE } from '../../contenu/demo';

/**
 * ══ CONSOLE 2/5 · LES TÉMOIGNAGES ══
 *
 * **RIEN NE S'AFFICHE SUR LE SITE SANS PASSER PAR CET ÉCRAN**, et c'est une décision de marque
 * avant d'être une décision de modération : le produit s'interdit la preuve sociale fabriquée.
 * Un témoignage publié est un témoignage LU, attribué à quelqu'un de joignable, sur une
 * formation qu'il a réellement suivie.
 *
 * TROIS ÉTATS, ET AUCUN N'EST « EN ATTENTE DE MODÉRATION » AU SENS HABITUEL :
 *   · à lire      personne ne l'a encore lu
 *   · publié      il est en ligne, avec le nom que la personne a autorisé
 *   · refusé      il ne sera pas publié, et la personne en est informée
 *
 * Le refus SILENCIEUX n'existe pas : quelqu'un qui prend le temps d'écrire mérite une réponse.
 */
export default function Temoignages() {
  const t = useToken();
  const [etape, setEtape] = useState('à lire 0');

  return (
    <ConsoleScreen
      titre="Témoignages"
      sourcil="Rôle support · écran 2 sur 5"
      lignes={['Ce que les gens', 'racontent.']}
    >
      <Pipeline
        stages={['tout 0', 'à lire 0', 'publiés 0', 'refusés 0']}
        active={etape}
        onSelect={setEtape}
        style={{ marginTop: 18 }}
      />

      <Surface level="night" style={{ marginTop: 14, padding: 6 }}>
        <EmptyState
          glyph={<Icon name="quote" size={26} color={t('mmOrange')} />}
          glyphBackground={veil(t('mmOrange'), 0.18)}
          title="Aucun témoignage à lire."
          body="La plateforme vient d'ouvrir. C'est aussi pourquoi il n'y en a aucun sur le site : ce qui n'existe pas ne s'affiche pas, même en petit."
        />
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Le relevé</Eyebrow>
      <Surface level="night" style={{ marginTop: 10, padding: 17 }}>
        <Num value={0} source={SOURCE} asOf={RELEVE} unit="témoignage reçu" style={{ fontSize: 15 }} />
        <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>
          Et zéro publié, forcément. Le site n'affiche pas de bloc « ils en parlent » vide : il
          n'affiche pas ce bloc du tout, tant qu'il n'a rien à mettre dedans.
        </Body>
      </Surface>

      <Surface level="night" style={{ marginTop: 12, padding: 16 }}>
        <Eyebrow style={{ fontSize: 10 }}>La règle de publication</Eyebrow>
        <Body muted style={{ fontSize: 12.5, lineHeight: 19, marginTop: 6 }}>
          Un témoignage se publie avec le nom que la personne a autorisé, sur une formation
          qu'elle a réellement suivie — la règle de la base recoupe l'inscription. Et un refus
          n'est jamais silencieux.
        </Body>
        <Button
          tone="quiet"
          size="sm"
          label="Voir la règle sur le site"
          style={{ marginTop: 12 }}
          onPress={() => { void openBrowserAsync('https://maxmorrys.me/legal/cgu'); }}
        />
      </Surface>

      <PiedDePortee quoi="Lire, publier ou refuser : trois gestes, et rien d'autre." />
    </ConsoleScreen>
  );
}
