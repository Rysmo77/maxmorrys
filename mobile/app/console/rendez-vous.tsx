import { useState } from 'react';
import {
  Body, Button, EmptyState, Eyebrow, Icon, Num, Pipeline, Surface, useToken, veil,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { RELEVE, SOURCE } from '../../contenu/reference';

/**
 * ══ CONSOLE 3/5 · LES RENDEZ-VOUS ══
 *
 * C'est l'écran le plus « debout » des cinq : un rendez-vous se confirme entre deux choses, et
 * la personne en face attend. D'où **une seule action par ligne — confirmer** — et un ordre
 * chronologique strict, jamais un tri par statut : ce qui est demain passe avant ce qui est
 * dans trois semaines, quel que soit son état.
 *
 * ── LE FUSEAU EST ÉCRIT ──────────────────────────────────────────────────────────────────
 * Dakar est à UTC+0 toute l'année, sans heure d'été — mais la moitié des demandes viennent
 * d'Europe, qui en a une. Un créneau sans fuseau est un rendez-vous manqué deux fois par an.
 */
export default function RendezVous() {
  const t = useToken();
  const [etape, setEtape] = useState('à confirmer 0');

  return (
    <ConsoleScreen
      titre="Rendez-vous"
      sourcil="Rôle support · écran 3 sur 5"
      lignes={['Les créneaux', 'demandés.']}
    >
      <Pipeline
        stages={['tout 0', 'à confirmer 0', 'confirmés 0', 'passés 0']}
        active={etape}
        onSelect={setEtape}
        style={{ marginTop: 18 }}
      />

      <Surface level="night" style={{ marginTop: 14, padding: 6 }}>
        <EmptyState
          glyph={<Icon name="calendar" size={26} color={t('mmBleu')} />}
          glyphBackground={veil(t('mmBleu'), 0.18)}
          title="Aucun rendez-vous demandé."
          body="Les créneaux se prennent depuis la page Présence Digitale. Rien n'est en attente de ta réponse."
        />
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Le relevé</Eyebrow>
      <Surface level="night" style={{ marginTop: 10, padding: 17 }}>
        <Num value={0} source={SOURCE} asOf={RELEVE} unit="rendez-vous demandé" style={{ fontSize: 15 }} />
        <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>
          Les heures s'affichent en heure de Dakar, avec leur fuseau écrit. Dakar n'a pas
          d'heure d'été ; l'Europe en a une, et la moitié des demandes en viennent.
        </Body>
        <Button tone="quiet" size="sm" label="Ouvrir mon agenda" style={{ marginTop: 12 }} />
      </Surface>

      <PiedDePortee quoi="Confirmer ou décaler : deux gestes, sur le créneau le plus proche d'abord." />
    </ConsoleScreen>
  );
}
