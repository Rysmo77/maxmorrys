import { useState } from 'react';
import {
  Body, EmptyState, Eyebrow, Icon, Num, Pipeline, Surface, useToken, veil,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { RELEVE, SOURCE } from '../../contenu/reference';

/**
 * ══ CONSOLE 5/5 · LES PROJETS ══
 *
 * Un projet est un pack VENDU et en cours de livraison. C'est là que se lit le **risque n° 1
 * de l'offre TPE : le plafond de livraison.** Une petite structure ne tient qu'un nombre fini
 * de packs en parallèle, et le jour où ce nombre est dépassé, ce n'est pas le chiffre
 * d'affaires qui souffre — c'est le délai promis à quelqu'un.
 *
 * D'OÙ CE QUE CET ÉCRAN COMPTE : des projets EN COURS, jamais un cumul de projets livrés. Un
 * total flatteur ne dit rien du seul chiffre utile — combien j'en tiens en ce moment.
 *
 * Debout, on ne fait qu'une chose ici : voir où en est chacun, et lequel a pris du retard.
 */
export default function Projets() {
  const t = useToken();
  const [etape, setEtape] = useState('en cours 0');

  return (
    <ConsoleScreen
      titre="Projets"
      sourcil="Rôle support · écran 5 sur 5"
      lignes={['Ce qui est', 'en livraison.']}
    >
      <Pipeline
        stages={['tout 0', 'en cours 0', 'en retard 0', 'livrés 0']}
        active={etape}
        onSelect={setEtape}
        style={{ marginTop: 18 }}
      />

      <Surface level="night" style={{ marginTop: 14, padding: 6 }}>
        <EmptyState
          glyph={<Icon name="boxes" size={26} color={t('mmViolet')} />}
          glyphBackground={veil(t('mmViolet'), 0.18)}
          title="Aucun projet en cours."
          body="Un projet apparaît ici quand un pack est vendu. Rien n'est en livraison, donc rien n'est en retard."
        />
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Le plafond de livraison</Eyebrow>
      <Surface level="night" style={{ marginTop: 10, padding: 17 }}>
        <Num value={0} source={SOURCE} asOf={RELEVE} unit="projet en cours" style={{ fontSize: 15 }} />
        <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>
          C'est le nombre EN COURS qui compte, jamais le cumul livré. Un total flatteur ne dit
          rien du seul chiffre utile : combien de packs on tient en parallèle sans faire glisser
          un délai promis.
        </Body>
      </Surface>

      <PiedDePortee quoi="Voir l'avancement et repérer un retard ; la production se pilote au bureau." />
    </ConsoleScreen>
  );
}
