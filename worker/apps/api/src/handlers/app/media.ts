import type { DocSnapshot } from '@mm/firestore-rest';

import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appMedia` — LE DERNIER ÉPISODE ET LA DERNIÈRE VIDÉO.
 *
 * Contenu PUBLIC : pas d'abonnement à vérifier, seulement une session — l'application
 * n'a aucun écran anonyme, et une vue qui répondrait sans jeton serait une exception à
 * expliquer plutôt qu'une commodité.
 *
 * ⚠️ ON NE PUBLIE QUE CE QUI EST PUBLIÉ. `status == 'published'` est refait ici : le
 * compte de service ne connaît pas le filtre que `firestore.rules` applique à un visiteur,
 * et un brouillon d'épisode qui remonte est une promesse qu'on ne tient pas.
 *
 * ── LE COÛT EN MÉGAOCTETS EST L'INFORMATION, PAS UNE DÉCORATION ──────────────────────
 * `cout` porte la durée ET les deux poids (HD, 480p) quand la base les connaît. Sur ce
 * marché, c'est ce qui décide de regarder maintenant ou d'attendre le Wi-Fi. Aucun de ces
 * nombres n'est estimé : ce qui manque est absent, pas arrondi.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function enClair(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
}

/** Le dernier document publié d'une collection, ou `null`. */
async function dernier(context: CallContext, collection: string): Promise<DocSnapshot | null> {
  const trouves = await context.db.query({
    collection,
    where: [{ field: 'status', op: '==', value: 'published' }],
    orderBy: [{ field: 'publishedAt', direction: 'desc' }],
    limit: 1,
  });
  return trouves[0] ?? null;
}

export async function appMedia(_data: unknown, context: CallContext): Promise<Reponse<'appMedia'>> {
  requireAuth(context);
  const releveA = new Date().toISOString();

  const [episode, video] = await Promise.all([
    dernier(context, 'podcasts'),
    dernier(context, 'videos'),
  ]);

  const titreEpisode = episode ? asText(episode.data.title) : null;
  const titreVideo = video ? asText(video.data.title) : null;

  return {
    vue: {
      /* Un épisode sans titre n'est pas un épisode : on ne rend pas une ligne dont on ne
         sait rien, elle porterait le nom d'un invité qui n'a rien enregistré. */
      episode: episode && titreEpisode ? {
        titre: titreEpisode,
        titreCourt: titreEpisode.split(/\s+(?:,|avec)\s+/)[0] ?? titreEpisode,
        invitee: asText(episode.data.guest) ?? null,
        eyebrow: ['Podcast', enClair(asText(episode.data.publishedAt))].filter(Boolean).join(' · '),
        chapo: asText(episode.data.description) ?? null,
        duree: asText(episode.data.duration) ?? null,
        lien: asText(episode.data.audioUrl) ?? null,
        /* Le coût d'un épisode, sur le même principe que celui d'une vidéo : ce qui manque
           est ABSENT, jamais arrondi. Aujourd'hui `podcasts` ne porte qu'une durée —
           `audioUrl` pointe vers Spotify, donc il n'y a ni fichier ni poids à annoncer. Le
           tableau ne portera un « 31 Mo » que le jour où l'audio sera ré-hébergé. */
        cout: [asText(episode.data.duration)].filter((v): v is string => Boolean(v)),
        /* La transcription telle qu'elle est écrite : du texte, éventuellement en markdown.
           Le kit natif la dessinait en LIGNES HORODATÉES (« 00:42 · … ») — une forme que le
           modèle ne porte pas et qui ne se déduit d'aucun champ. On envoie donc le texte, et
           l'écran le rend en paragraphes plutôt que d'inventer des minutages.

           C'est aussi ce qui rend l'épisode lisible SANS charger l'audio : sur un forfait
           compté, la transcription n'est pas un complément, c'est une porte d'entrée. */
        transcription: asText(episode.data.transcript) ?? null,
      } : null,

      video: video && titreVideo ? {
        titre: titreVideo,
        eyebrow: ['Vidéo', enClair(asText(video.data.publishedAt))].filter(Boolean).join(' · '),
        lien: asText(video.data.videoUrl) ?? null,
        // Durée et poids : ce qui manque est ABSENT, jamais arrondi.
        cout: [
          asText(video.data.duration),
          typeof video.data.sizeHdMb === 'number' ? `${video.data.sizeHdMb} Mo en HD` : null,
          typeof video.data.sizeSdMb === 'number' ? `${video.data.sizeSdMb} Mo en 480p` : null,
        ].filter((v): v is string => Boolean(v)),
      } : null,
    },
    releveA,
  };
}
