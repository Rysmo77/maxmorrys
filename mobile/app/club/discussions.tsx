import { useState } from 'react';
import { View } from 'react-native';
import {
  Avatar, Body, ChipRow, EmptyState, Eyebrow, Icon, Num, Surface, Tag, useToken,
} from '../../ds';
import { ClubScreen } from './_layout';
import { DISCUSSIONS, RELEVE, SOURCE } from '../../contenu/demo';

/**
 * ── CLUB · DISCUSSIONS ────────────────────────────────────────────────────────────────
 *
 * **LA QUESTION BÊTE SE POSE ICI.** C'est la promesse de l'onglet, et elle décide de son
 * dessin : pas de score de réputation, pas de « meilleure réponse » élue par des votes, pas
 * de badge. Trois choses seulement — qui demande, depuis quand, et si quelqu'un a répondu.
 *
 * LE DÉCOMPTE DÉRIVE DES LISTES STOCKÉES, ce n'est pas un compteur libre : personne ne saisit
 * « 14 réponses » à la main, c'est la longueur d'une liste. Un compteur qu'on peut écrire est
 * un compteur qui finit par diverger de ce qu'on peut ouvrir.
 *
 * « RÉSOLU » EST POSÉ PAR CELUI QUI A DEMANDÉ, jamais par un modérateur : c'est la seule
 * personne qui sache si la réponse a marché.
 */
const CATEGORIES = ['Toutes', 'Entraide', 'Outils', 'Clients'] as const;

export default function ClubDiscussions() {
  const t = useToken();
  const [cat, setCat] = useState<string>(CATEGORIES[0]);

  const visibles = cat === 'Toutes' ? DISCUSSIONS : DISCUSSIONS.filter((d) => d.categorie === cat);

  return (
    <ClubScreen titre="Discussions">
      <ChipRow options={CATEGORIES} value={cat} onChange={setCat} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
        <Eyebrow>{cat === 'Toutes' ? 'Toutes catégories' : cat}</Eyebrow>
        <Num
          value={visibles.length}
          source={SOURCE}
          asOf={RELEVE}
          unit={visibles.length > 1 ? 'discussions' : 'discussion'}
          style={{ fontSize: 12 }}
        />
      </View>

      {visibles.length === 0 ? (
        <Surface level="flat" style={{ marginTop: 12, paddingVertical: 6 }}>
          <EmptyState
            glyph={<Icon name="chat" size={24} color={t('mmVioletT')} />}
            title={`Rien dans « ${cat} »`}
            body="Le filtre marche : cette catégorie est vide au relevé du jour. C'est une information, pas une panne."
          />
        </Surface>
      ) : visibles.map((d) => (
        <Surface key={d.titre} level="flat" style={{ marginTop: 12, padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 11, alignItems: 'center' }}>
            <Avatar initials={d.initiales} size={34} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 13.5, fontWeight: '600' }}>{d.auteur}</Body>
              <Body muted style={{ fontFamily: 'JetBrainsMono', fontSize: 11, color: t('textFaint') }}>
                {d.categorie} · {d.quand}
              </Body>
            </View>
            {d.resolu ? <Tag tone="ok">Résolu</Tag> : null}
          </View>

          <Body style={{ marginTop: 11, fontSize: 14.5, lineHeight: 21, fontWeight: '600' }}>{d.titre}</Body>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}>
            <Icon name="comment" size={15} color={t('ink2')} />
            <Num
              value={d.reponses}
              source={SOURCE}
              asOf={RELEVE}
              unit={d.reponses > 1 ? 'réponses' : 'réponse'}
              style={{ fontSize: 12.5 }}
            />
          </View>
        </Surface>
      ))}

      <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
        <Eyebrow>D'où vient le décompte</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Chaque publication est classée par catégorie, et le nombre affiché est la longueur de
          la liste — pas un compteur qu'on saisit. « Résolu » est posé par la personne qui a
          demandé, jamais par un modérateur : c'est la seule qui sache si ça a marché.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 17 }}>
        <Eyebrow>Qui répond</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          D'autres membres, et moi. Pas un modérateur, pas un robot — c'est ce que l'abonnement
          paie, et c'est écrit sur le mur avant de payer.
        </Body>
        <Body muted style={{ marginTop: 10, fontSize: 12.5, lineHeight: 19 }}>
          Une question ouverte depuis longtemps sans réponse remonte : c'est le seul tri
          automatique de cet onglet.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
