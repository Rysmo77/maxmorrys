import type { Firestore } from '@mm/firestore-rest';

import type { Canal } from './rysmo-canal';
import { asText } from './values';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA LEÇON QUE L'ÉLÈVE A SOUS LES YEUX — lue côté serveur, jamais reçue du client.
 *
 * Jusqu'au 01/11/2026, Rysmo ne voyait AUCUNE leçon : le seul contenu de cours qui lui
 * parvenait était une note relue (`notes.askRysmoPrompt`, 1 200 caractères, collée dans la
 * question). Un élève qui demandait « c'est quoi le pack local dont parle la leçon ? »
 * recevait une réponse générique.
 *
 * Le client n'envoie que DEUX IDENTIFIANTS (`lecon: { formationId, leconId }`), posés par le
 * lecteur de cours (`src/pages/lms/CoursePlayer.tsx`). Le texte est relu ici dans Firestore,
 * avec la MÊME règle d'accès que `appLeconContenu` :
 *   - l'élève est inscrit à la formation (inscription cherchée par l'uid du JETON) ;
 *   - ou la leçon est `isFree` dans une formation publiée (l'aperçu public).
 * Sinon : rien. Un texte de leçon fourni par le client serait une porte vers le contenu
 * payant (« voici la leçon, résume-la ») et vers l'injection de consignes.
 *
 * Le contenu est BORNÉ (`BUDGET_LECON`) et coupé proprement — à la fin d'un paragraphe, à
 * défaut d'une phrase — avec une marque explicite : le modèle sait qu'il manque la suite.
 * Une leçon sans texte (vidéo, quiz pas encore rédigé) est annoncée par son seul titre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

export const BUDGET_LECON = 6000;

export interface DemandeLecon {
  formationId?: unknown;
  leconId?: unknown;
}

interface Lecon {
  id?: unknown;
  title?: unknown;
  type?: unknown;
  content?: unknown;
  isFree?: unknown;
}
interface Module {
  title?: unknown;
  lessons?: Lecon[];
}

/** Un identifiant Firestore plausible : pas de `/`, pas de vide, longueur raisonnable. */
function identifiant(v: unknown): string | null {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v) ? v : null;
}

/** Le texte d'une leçon débarrassé de ce qui ne s'explique pas : balises, images, vidéos. */
export function nettoyerContenu(contenu: string): string {
  return contenu
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images markdown
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Coupe à `max` caractères au plus, proprement : fin de paragraphe si elle n'est pas trop
 * tôt, sinon fin de phrase, sinon dernier espace. Jamais au milieu d'un mot.
 */
export function extraitBorne(texte: string, max: number = BUDGET_LECON): string {
  if (texte.length <= max) return texte;
  const marque = '\n\n[… suite de la leçon non incluse]';
  const fenetre = texte.slice(0, max - marque.length);
  const plancher = Math.floor(fenetre.length * 0.6);

  let coupe = fenetre.lastIndexOf('\n\n');
  if (coupe < plancher) {
    const phrases = [...fenetre.matchAll(/[.!?…](?=\s)/g)];
    const derniere = phrases.length ? (phrases[phrases.length - 1].index ?? -1) + 1 : -1;
    coupe = derniere >= plancher ? derniere : fenetre.lastIndexOf(' ');
  }
  if (coupe <= 0) coupe = fenetre.length;
  return `${fenetre.slice(0, coupe).trimEnd()}${marque}`;
}

/**
 * Le bloc « LEÇON EN COURS » du prompt, ou `''` si la leçon est introuvable, inaccessible ou
 * vide. Non bloquant : une lecture qui échoue dégrade la réponse, elle ne l'empêche pas.
 */
export async function getLessonContext(
  db: Firestore,
  uid: string,
  demande: DemandeLecon | undefined,
  canal: Canal,
): Promise<string> {
  const formationId = identifiant(demande?.formationId);
  const leconId = identifiant(demande?.leconId);
  if (!formationId || !leconId) return '';

  try {
    const [formation, inscriptions] = await Promise.all([
      db.get(`formations/${formationId}`),
      db.query({
        collection: 'enrollments',
        where: [
          { field: 'userId', op: '==', value: uid },
          { field: 'formationId', op: '==', value: formationId },
        ],
        limit: 1,
      }),
    ]);
    if (!formation) return '';

    const modules: Module[] = Array.isArray(formation.data.modules) ? (formation.data.modules as Module[]) : [];
    let trouvee: { lecon: Lecon; module: Module } | null = null;
    for (const module of modules) {
      const lecon = (module.lessons ?? []).find((l) => String(l.id ?? '') === leconId);
      if (lecon) {
        trouvee = { lecon, module };
        break;
      }
    }
    if (!trouvee) return '';

    const inscrit = inscriptions.length > 0;
    const apercu = formation.data.status === 'published' && trouvee.lecon.isFree === true;
    if (!inscrit && !apercu) return '';

    const brut = typeof trouvee.lecon.content === 'string' ? trouvee.lecon.content : '';
    /*
     * Un texte vide est le cas COURANT au 01/11/2026 : les 57 leçons des deux formations
     * publiées n'ont encore aucun texte (vidéos et quiz à venir). Le titre reste utile — il dit
     * de quoi parle l'élève —, à condition d'interdire au modèle d'en inventer le contenu.
     */
    const contenu = extraitBorne(nettoyerContenu(brut))
      || "(Le texte de cette leçon n'est pas disponible ici : appuie-toi sur son titre, sans inventer ce qu'elle contient.)";

    const type = asText(trouvee.lecon.type) ?? 'text';
    const entete = [
      `Formation : « ${asText(formation.data.title) ?? ''} »`,
      asText(trouvee.module.title) ? `Module : « ${asText(trouvee.module.title)} »` : '',
      `Leçon : « ${asText(trouvee.lecon.title) ?? ''} »${type !== 'text' ? ` (${type})` : ''}`,
    ].filter(Boolean).join(' · ');

    return [
      '',
      "── LEÇON QUE L'ÉLÈVE A SOUS LES YEUX (contenu réel, lu dans la plateforme) ──",
      entete,
      '',
      contenu,
      '',
      "→ Quand la question porte sur cette leçon, appuie-toi D'ABORD sur elle (« comme le dit ta leçon… ») et reste cohérent avec ce qu'elle enseigne. Ne la recopie pas : explique, reformule, donne un exemple.",
      '→ Ne crée aucun lien vers cette leçon ni vers un module : il n\'y a pas d\'adresse publique de leçon.',
      type === 'quiz'
        ? "→ C'est un quiz : aide l'élève à raisonner, ne lui donne pas directement les bonnes réponses."
        : '',
      !inscrit && canal === 'web' ? "→ C'est une leçon d'aperçu : l'élève n'est pas (encore) inscrit à cette formation." : '',
    ]
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd();
  } catch (error: unknown) {
    console.warn('getLessonContext a échoué (non bloquant) :', error);
    return '';
  }
}
