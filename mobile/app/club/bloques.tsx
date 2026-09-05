import { Alert } from 'react-native';
import { useState } from 'react';
import {
  Avatar, Body, EmptyState, Eyebrow, Icon, LessonRow, SansDonnees, Surface, useToken, veil,
} from '../../ds';
import { ClubScreen } from './_layout';
import { bloquerLeMembre, useBlocages } from '../../donnees';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ── CLUB · LES COMPTES BLOQUÉS ──
 *
 * Cet écran existe pour une exigence de magasin, et il vaut mieux que ce soit dit : la
 * guideline App Store 1.2 demande de pouvoir BLOQUER un membre abusif dès qu'une application
 * publie du contenu de membre à membre. Le Club en publie ; il ne le permettait pas.
 *
 * ── MAIS UN BLOCAGE QU'ON NE PEUT PAS DÉFAIRE EST UN PIÈGE ──────────────────────────────
 * Le geste se prend souvent dans un moment d'agacement, sur une plateforme où l'on se croise
 * professionnellement — et où l'on peut avoir besoin, trois mois plus tard, de la personne
 * qu'on a bloquée. Une liste sans porte de sortie transforme une irritation en rupture.
 *
 * ── CE QUE LE BLOCAGE FAIT, ET CE QU'IL NE FAIT PAS ─────────────────────────────────────
 * Il retire les publications de la personne de TOUT le Club — le fil, les discussions, les
 * opportunités —, pas seulement de l'écran où on l'a bloquée : croiser le même nom la minute
 * d'après annulerait le geste. Il ne la prévient pas, il ne l'exclut de rien, et il ne dit
 * rien à personne. C'est écrit à l'écran, parce que c'est exactement ce qu'on se demande en
 * appuyant.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ClubBloques() {
  const t = useToken();
  const etat = useBlocages();
  const [enCours, setEnCours] = useState<string | null>(null);
  const comptes = etat.valeur?.comptes ?? [];

  function debloquer(id: string, nom: string) {
    Alert.alert(
      `Débloquer ${nom} ?`,
      'Ses publications réapparaîtront dans le fil, les discussions et les opportunités.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Débloquer',
          onPress: () => {
            setEnCours(id);
            void bloquerLeMembre({ type: 'membre', id }, false)
              .catch(() => Alert.alert(
                'Le déblocage n’a pas abouti',
                'Rien n’a changé. Réessaie dans un moment.',
              ))
              .finally(() => setEnCours(null));
          },
        },
      ],
    );
  }

  return (
    <ClubScreen titre="Comptes bloqués">
      <Eyebrow>Ce que le blocage fait</Eyebrow>
      <Surface level="truth" style={{ marginTop: 10, padding: 15 }}>
        <Body muted style={{ fontSize: 12.5, lineHeight: 19 }}>
          Les publications d’un compte bloqué disparaissent du fil, des discussions et des
          opportunités. La personne n’en est pas prévenue, elle n’est exclue de rien, et
          personne d’autre ne le voit.
        </Body>
      </Surface>

      {comptes.length > 0 ? (
        <Surface level="flat" style={{ marginTop: 16, paddingHorizontal: 16 }}>
          {comptes.map((c, i) => (
            <LessonRow
              key={c.id}
              icon={<Avatar initials={c.initiales} size={30} />}
              title={c.nom}
              meta={enCours === c.id ? 'déblocage en cours…' : 'appuie pour débloquer'}
              last={i === comptes.length - 1}
              onPress={enCours === null ? () => debloquer(c.id, c.nom) : undefined}
            />
          ))}
        </Surface>
      ) : etat.valeur === null ? (
        <SansDonnees
          quoi="tes comptes bloqués"
          degat="Une liste de blocage inventée montrerait des noms de personnes que tu n'as jamais bloquées. C'est le seul endroit du produit où une simulation accuserait quelqu'un."
          etat={etat}
          hauteur={2}
          style={{ marginTop: 16 }}
        />
      ) : (
        <Surface level="flat" style={{ marginTop: 16, padding: 6 }}>
          <EmptyState
            glyph={<Icon name="user" size={26} color={t('mmVioletT')} />}
            glyphBackground={veil(t('mmViolet'), 0.16)}
            title="Tu n’as bloqué personne."
            body="Depuis la fiche d’un membre, « Bloquer ce membre » retire ses publications de tout le Club. Tu pourras revenir ici pour défaire."
          />
        </Surface>
      )}
    </ClubScreen>
  );
}
