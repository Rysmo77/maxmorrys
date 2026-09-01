import { useState } from 'react';
import { View } from 'react-native';
import { Body, ChipRow, EmptyState, Eyebrow, Icon, Surface, useToken } from '../../ds';
import { Bilan, ClubScreen } from './_layout';

/**
 * ── 7 · OPPORTUNITÉS ──────────────────────────────────────────────────────────────────
 *
 * LE BILAN OUVRE AUSSI CET ÉCRAN, et ce n'est pas une répétition de mise en page. Les
 * opportunités sont l'endroit où l'abonnement se justifie ou ne se justifie pas : « deux
 * missions décrochées » se lit à côté des missions qu'on n'a pas encore regardées. Le bilan
 * est permanent, pas terminal — donc il est ici comme il est sur le fil.
 *
 * ET LES BUDGETS NE SONT PAS VÉRIFIÉS PAR LA PLATEFORME. Troisième engagement du Club, et
 * celui qu'un produit a le plus envie de taire : « 450 000 F » sur une carte se lit comme
 * une promesse de la plateforme alors que c'est une déclaration de l'annonceur. C'est donc
 * ÉCRIT sur l'écran, à côté des cartes, plutôt que caché dans des conditions générales — y
 * compris quand il n'y a aucune carte à afficher, parce que la règle précède les annonces.
 *
 * AUCUNE ANNONCE N'EST SIMULÉE. Un budget inventé est le pire chiffre du produit : il fixe
 * une attente de revenu chez quelqu'un qui décide de son temps là-dessus.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
const FILTRES = ['Toutes', 'Missions', "Appels d'offres", 'Recrutement'] as const;

export default function ClubOpportunites() {
  const t = useToken();
  const [filtre, setFiltre] = useState<string>(FILTRES[0]);

  return (
    <ClubScreen titre="Opportunités">
      {/* ENGAGEMENT 1 — le même bilan qu'en tête du fil, pour la même raison. */}
      <Bilan />

      <View style={{ marginTop: 20 }}>
        <ChipRow options={FILTRES} value={filtre} onChange={setFiltre} />
      </View>

      <Surface level="flat" style={{ marginTop: 18, paddingVertical: 6 }}>
        <EmptyState
          glyph={<Icon name="case" size={24} color={t('mmVioletT')} />}
          title={filtre === 'Toutes' ? 'Aucune annonce chargée' : `Aucune annonce chargée dans « ${filtre} »`}
          body="Les missions, appels d'offres et offres d'emploi viennent de la base, comme sur le site. Je n'en fabrique aucune : un budget inventé fixe une attente de revenu chez quelqu'un qui organise son temps là-dessus."
        />
      </Surface>

      {/* ENGAGEMENT 3 — la règle est écrite même quand la liste est vide. */}
      <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>Les budgets ne sont pas vérifiés</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Les budgets affichés sont ceux annoncés par la personne qui publie. Ils ne sont pas
          vérifiés par la plateforme, et c'est écrit ici plutôt que caché.
        </Body>
        <Body muted style={{ marginTop: 8, fontSize: 12.5 }}>
          Quand une annonce s'affichera, ce montant portera sa source. Un chiffre sans source
          ne s'affiche pas.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
