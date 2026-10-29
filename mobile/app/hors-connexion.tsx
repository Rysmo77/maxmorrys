import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, LessonRow, Screen, Surface, Tag, useToken, Ligne,
  Liste, Rubrique,
} from '../ds';
import { envoyerLaFile, oublierEcartees, useHorsLigne } from '../donnees/hors-ligne';
import { useReseau } from '../donnees/veille-reseau';
import { poids } from '../donnees/garde';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 6 · HORS CONNEXION ══ — LA DIVERGENCE LA PLUS UTILE DU NATIF.
 *
 * EN WEB, C'EST UNE REQUÊTE QUI ÉCHOUE : l'écran arrive après trente secondes d'attente, une
 * fois le délai expiré, et il arrive donc TROP TARD — la personne a déjà conclu que
 * l'application était cassée.
 *
 * EN NATIF, LE SYSTÈME ANNONCE LA COUPURE **AVANT** QU'UNE REQUÊTE SOIT TENTÉE. L'écran est
 * juste dès la première image. Et une seconde chose en découle, qui change le produit :
 *
 *   **LA FILE D'ENVOI DEVIENT UN OBJET PERMANENT**, au lieu d'un rattrapage. Ce qui a été fait
 *   hors réseau est LISTÉ, avec son heure, et il part au retour du réseau sans rien demander.
 *   Une progression qui disparaît parce que le réseau a coupé est la façon la plus sûre de
 *   perdre quelqu'un ; la voir en attente est la façon la plus simple de le rassurer.
 *
 * ⓘ BRANCHÉ LE 05/10/2026. Il affichait des leçons téléchargées et une file d'envoi tirées du
 * contenu de démonstration — deux promesses qu'aucun code ne tenait, et qu'aucun écran
 * n'ouvrait. Il lit maintenant `hors-ligne.ts` (ce qui est réellement gardé, ce qui attend
 * réellement) et `veille-reseau.ts` (le réseau, en direct). Le bandeau de coupure y mène.
 *
 * ⛔ UN GESTE REFUSÉ PAR LE SERVEUR EST MONTRÉ, PAS ÉVAPORÉ. Une leçon retirée de la
 * formation ne se cochera jamais : le geste sort de la file pour ne pas la bloquer, mais il
 * reste listé ici avec son motif jusqu'à ce que la personne l'ait vu.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const heure = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function HorsConnexion() {
  const t = useToken();
  const reseau = useReseau();
  const { gardees, file, ecartees, envoi } = useHorsLigne();
  const coupe = reseau === 'absent';
  /* Tant que le système n'a pas répondu, on ne dit ni « pas de réseau » ni « il est là ». */
  const inconnu = reseau === 'indetermine';

  return (
    <Screen
      territory="informe"
      espace="hub"
      retour="Retour"
      droite={inconnu ? <Tag>Vérification…</Tag> : coupe ? <Tag tone="stop">Hors connexion</Tag> : <Tag tone="ok">Réseau revenu</Tag>}
    >
      <Display size={29} lines={[inconnu ? 'Vérification du réseau…' : coupe ? 'Pas de réseau.' : 'Le réseau est là.']} style={{ marginTop: 6 }} />
      <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
        {gardees.length === 0
          ? "Aucune leçon n'est gardée sur ce téléphone. Dans une leçon, la flèche en haut à droite la garde : son texte se lit ensuite sans réseau."
          : `Tu peux lire ${gardees.length > 1 ? `les ${gardees.length} leçons gardées` : 'la leçon gardée'} sur ce téléphone. Ce que tu fais sans réseau part dès qu'il revient.`}
      </Body>

      {gardees.length > 0 ? (
        <>
          <Eyebrow style={{ marginTop: 22 }}>Disponible sans réseau</Eyebrow>
          <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 16 }}>
            {[...gardees].sort((a, b) => b.gardeeLe.localeCompare(a.gardeeLe)).map((l, i, liste) => (
              <LessonRow
                key={l.cle}
                state="todo"
                icon={<Icon name="doc" size={13} color={t('ink2')} />}
                title={l.titre}
                meta={[poids(l.octets), l.videoEnLigne ? 'texte seulement · la vidéo demande du réseau' : null].filter(Boolean).join(' · ')}
                onPress={() => router.push({ pathname: '/lecon', params: { formationId: l.formationId, leconId: l.leconId } })}
                last={i === liste.length - 1}
              />
            ))}
          </Surface>
        </>
      ) : null}

      <Eyebrow style={{ marginTop: 22 }}>En attente d'envoi</Eyebrow>
      {file.length === 0 ? (
        <Body muted style={{ marginTop: 10, fontSize: 13.5 }}>Rien n'attend : tout ce que tu as fait est parti.</Body>
      ) : (
        <Liste>
          {file.map((f) => (
            <Ligne
              key={f.id}
              icone={f.operation.type === 'ecrireUneNote' ? 'pencil' : f.operation.type === 'posterAuClub' ? 'comment' : 'check'}
              fondIcone={t('mmOrange')}
              titre={f.titre}
              sous={`fait le ${heure(f.faitLe)}`}
              droite={<Icon name="clock" size={16} color={t('mmOrangeT')} strokeWidth={2.2} />}
            />
          ))}
        </Liste>
      )}
      {file.length > 0 && !coupe ? (
        <Button
          tone="quiet"
          label={envoi === 'en cours' ? 'Envoi en cours…' : 'Envoyer maintenant'}
          disabled={envoi === 'en cours'}
          style={{ marginTop: 12 }}
          onPress={() => { void envoyerLaFile(); }}
        />
      ) : null}

      {ecartees.length > 0 ? (
        <>
          <Rubrique>Refusé par le serveur</Rubrique>
          <Liste>
            {ecartees.map((e) => (
              <Ligne
                key={e.id}
                icone="alert"
                danger
                titre={e.titre}
                sous={e.motif}
              />
            ))}
          </Liste>
          <Button tone="quiet" label="J'ai vu" style={{ marginTop: 12 }} onPress={() => { void oublierEcartees(); }} />
        </>
      ) : null}

      {/* L'encart « ce que l'app sait, et que le site ignorait » est parti : il expliquait la
          conception à la personne qui n'a pas de réseau. */}
      <Body muted style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
        La file part au retour du réseau, sans rien te demander. Cocher puis décocher la même
        leçon n'envoie que le dernier état.
      </Body>
    </Screen>
  );
}
