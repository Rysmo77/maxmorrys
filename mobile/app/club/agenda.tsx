import { useState } from 'react';
import { EmptyState, Eyebrow, Icon, Segmented, Surface, Body, useToken } from '../../ds';
import { ClubScreen } from './_layout';

/**
 * ── 4 · AGENDA ────────────────────────────────────────────────────────────────────────
 *
 * Trois VUES sur une même liste, pas trois filtres : `Segmented` et non `ChipRow`. La
 * distinction n'est pas cosmétique — un segment dit « la même chose, autrement », une puce
 * dit « moins de choses ». « Mes inscriptions » n'est pas un sous-ensemble décoratif de
 * « À venir » : c'est le même agenda, vu depuis ce que tu as réservé.
 *
 * AUCUNE SESSION N'EST INVENTÉE. Une session fabriquée est une date à laquelle quelqu'un se
 * présenterait — en ligne à 20 h, ou à Dakar un samedi matin. C'est le seul type de donnée
 * simulée qui fait sortir quelqu'un de chez lui.
 *
 * ET AUCUN NOMBRE DE PLACES. « 4 / 12 places » de la maquette est un état de stock : il se
 * lit dans la base ou il ne s'affiche pas.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
const VUES = ['À venir', 'Mes inscriptions', 'Passées'] as const;

const VIDE: Record<string, { titre: string; corps: string }> = {
  'À venir': {
    titre: 'Aucune session chargée',
    corps: "L'agenda est publié un mois à l'avance, mais ce port natif ne lit pas encore la liste. Je n'affiche pas de session d'exemple : une date inventée est une date à laquelle tu te présenterais.",
  },
  'Mes inscriptions': {
    titre: 'Tes inscriptions ne sont pas branchées',
    corps: "Elles vivent sur le même compte que sur le site. Tant que cet écran ne sait pas les lire, il ne prétend ni que tu es inscrite, ni que tu ne l'es pas.",
  },
  'Passées': {
    titre: 'Aucune session passée chargée',
    corps: "L'historique viendra de la même liste que le reste de l'agenda. Rien n'est reconstitué de mémoire ici.",
  },
};

export default function ClubAgenda() {
  const t = useToken();
  const [vue, setVue] = useState<string>(VUES[0]);
  const vide = VIDE[vue] ?? VIDE['À venir'];

  return (
    <ClubScreen titre="Agenda">
      <Segmented options={VUES} value={vue} onChange={setVue} />

      <Surface level="flat" style={{ marginTop: 18, paddingVertical: 6 }}>
        <EmptyState
          glyph={<Icon name="calendar" size={24} color={t('mmVioletT')} />}
          title={vide.titre}
          body={vide.corps}
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Ce que l'inscription fait, et ne fait pas</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.
          Une session annoncée a lieu, même à quatre.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
