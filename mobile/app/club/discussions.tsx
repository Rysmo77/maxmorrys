import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Body, ChipRow, EmptyState, Eyebrow, Icon, Num, Surface, useToken } from '../../ds';
import { ClubScreen, dateReleve, mesure } from './_layout';

/**
 * ── 3 · DISCUSSIONS ───────────────────────────────────────────────────────────────────
 *
 * Quatre catégories, et un décompte par catégorie. Le kit écrit la règle qui gouverne ce
 * décompte : « il dérive des listes stockées, ce n'est pas un compteur libre ». Autrement
 * dit, personne ne saisit « 14 réponses » à la main — le nombre est la longueur d'une
 * liste, et il ne peut donc pas s'en écarter.
 *
 * ICI, LES LISTES NE SONT PAS BRANCHÉES. Le décompte ne s'affiche donc que s'il arrive par
 * la route AVEC sa date de relevé ; sinon il dit « non relevé ». Un zéro daté serait une
 * information — « aucune discussion dans Outils au 31/08 » — un tiret n'en est pas une.
 *
 * LE FILTRE, LUI, EST VRAI. Il ne filtre encore rien, mais il retient ce que tu as choisi
 * et l'écrit : c'est un contrôle réel sur un ensemble vide, pas une décoration.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
const CATEGORIES = ['Toutes', 'Entraide', 'Outils', 'Clients'] as const;

export default function ClubDiscussions() {
  const t = useToken();
  const [cat, setCat] = useState<string>(CATEGORIES[0]);
  const p = useLocalSearchParams<{ compte?: string; releve?: string }>();
  const compte = mesure(p.compte, dateReleve(p.releve));

  return (
    <ClubScreen titre="Discussions">
      <ChipRow options={CATEGORIES} value={cat} onChange={setCat} />

      <Surface level="flat" style={{ marginTop: 18, padding: 18 }}>
        <Eyebrow>{cat === 'Toutes' ? 'Toutes catégories' : cat}</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 13 }}>
          Discussions classées dans cette catégorie
        </Body>
        <Num
          value={compte.value}
          source="db"
          asOf={compte.asOf}
          style={{ fontSize: 27, marginTop: 4 }}
          fallback="non relevé"
        />
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, paddingVertical: 6 }}>
        <EmptyState
          glyph={<Icon name="chat" size={24} color={t('mmVioletT')} />}
          title="Aucune discussion chargée"
          body="Le filtre fonctionne, la liste qu'il filtre n'est pas encore branchée. Je n'invente pas de sujet ni de réponse pour meubler : une discussion fabriquée porte une question que personne n'a posée et une réponse que personne n'a écrite."
        />
      </Surface>

      <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
        <Eyebrow>D'où viendra le décompte</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Chaque publication est classée par catégorie. Le décompte affiché dérive des listes
          stockées : ce n'est pas un compteur libre, et personne ne le saisit à la main.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
