/**
 * Génération d'une photo de fond par Workers AI (FLUX.2 [dev]), pour les couvertures
 * d'articles et de formations rendues par `render-card` (décision de Max du 01/11/2026).
 *
 * `POST /internal/generate-image` — même secret que `/internal/upload` (`INTERNAL_UPLOAD_KEY`,
 * en-tête `X-Internal-Key`) : le seul appelant est le service render-card du VPS, qui détient
 * déjà ce secret. Aucun nouveau secret à poser.
 *
 * Garde-fous, tous côté Worker (un appelant compromis ne peut pas les lever) :
 *  - dimensions bornées : 256 à 1536 px, multiples de 16 ;
 *  - prompt borné (1 000 caractères) et SUFFIXE IMPOSÉ : aucun texte, lettre, logo, enseigne ni
 *    filigrane dans la photo — le texte de la couverture est posé par render-card, jamais par l'IA ;
 *  - clé R2 imposée (`ai-covers/<uuid>.<ext>`) : on ajoute une image, on n'en écrase jamais ;
 *  - limite de débit : binding Rate Limiting si présent, sinon un compteur par isolat.
 */

export const MODELE_IMAGE = '@cf/black-forest-labs/flux-2-dev';
export const PREFIXE_AI = 'ai-covers/';
export const SUFFIXE_PROMPT = 'No text, no letters, no logos, no signs, no watermark.';
const PROMPT_MAX = 1000;
const DIM_MIN = 256;
const DIM_MAX = 1536;

/** Fenêtre de repli quand aucun binding de limite n'est configuré : 10 images par minute et par isolat. */
const FENETRE_MS = 60_000;
const PLAFOND_FENETRE = 10;
let fenetre = { debut: 0, n: 0 };

export interface GenerateEnv {
  AI?: { run(model: string, inputs: unknown, options?: unknown): Promise<unknown> };
  BUCKET: R2Bucket;
  PUBLIC_MEDIA_BASE: string;
  INTERNAL_UPLOAD_KEY?: string;
  /** Binding Rate Limiting (`[[ratelimits]]` dans wrangler.toml), facultatif. */
  GENERATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

export interface DemandeImage {
  prompt: string;
  width: number;
  height: number;
}

/** Valide le corps reçu. Renvoie la demande normalisée ou un message d'erreur. */
export function validerDemande(corps: unknown): DemandeImage | { error: string } {
  if (!corps || typeof corps !== 'object') return { error: 'Corps JSON attendu' };
  const { prompt, width, height } = corps as Record<string, unknown>;
  if (typeof prompt !== 'string' || !prompt.trim()) return { error: '`prompt` est requis' };
  if (prompt.length > PROMPT_MAX) return { error: `\`prompt\` dépasse ${PROMPT_MAX} caractères` };
  for (const [nom, v] of [['width', width], ['height', height]] as const) {
    if (typeof v !== 'number' || !Number.isInteger(v)) return { error: `\`${nom}\` doit être un entier` };
    if (v < DIM_MIN || v > DIM_MAX) return { error: `\`${nom}\` doit être entre ${DIM_MIN} et ${DIM_MAX}` };
    if (v % 16 !== 0) return { error: `\`${nom}\` doit être un multiple de 16` };
  }
  return { prompt: prompt.trim(), width: width as number, height: height as number };
}

/** Le prompt réellement envoyé : celui de l'appelant + le suffixe imposé. */
export function promptFinal(prompt: string): string {
  const p = prompt.trim().replace(/\s+/g, ' ');
  return `${/[.!?]$/.test(p) ? p : `${p}.`} ${SUFFIXE_PROMPT}`;
}

/** Type d'image d'après les octets de tête (FLUX renvoie du JPEG ; PNG accepté par prudence). */
export function typeImage(octets: Uint8Array): { mime: string; ext: string } | null {
  if (octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (octets[0] === 0x89 && octets[1] === 0x50 && octets[2] === 0x4e && octets[3] === 0x47) return { mime: 'image/png', ext: 'png' };
  if (octets[0] === 0x52 && octets[1] === 0x49 && octets[2] === 0x46 && octets[3] === 0x46) return { mime: 'image/webp', ext: 'webp' };
  return null;
}

function base64VersOctets(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function sousLaLimite(env: GenerateEnv, maintenant: number): Promise<boolean> {
  if (env.GENERATE_LIMITER) {
    const { success } = await env.GENERATE_LIMITER.limit({ key: 'generate-image' });
    return success;
  }
  if (maintenant - fenetre.debut >= FENETRE_MS) fenetre = { debut: maintenant, n: 0 };
  fenetre.n += 1;
  return fenetre.n <= PLAFOND_FENETRE;
}

/** Remet à zéro le compteur de repli (tests). */
export function _reinitialiserLimite(): void {
  fenetre = { debut: 0, n: 0 };
}

/** Comparaison à temps constant — `timingSafeEqual` n'existe pas sur Workers. */
export function egalTempsConstant(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}

export async function handleGenerateImage(
  req: Request,
  env: GenerateEnv,
  cors: Record<string, string> = {},
  maintenant: number = Date.now(),
): Promise<Response> {
  if (!env.INTERNAL_UPLOAD_KEY) return json({ error: 'Endpoint non configuré' }, 503, cors);
  if (!egalTempsConstant(req.headers.get('X-Internal-Key') ?? '', env.INTERNAL_UPLOAD_KEY)) {
    return json({ error: 'Non autorisé' }, 401, cors);
  }
  if (!env.AI) return json({ error: 'Workers AI non lié (binding AI absent)' }, 503, cors);

  let corps: unknown;
  try {
    corps = await req.json();
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400, cors);
  }
  const demande = validerDemande(corps);
  if ('error' in demande) return json(demande, 400, cors);

  if (!(await sousLaLimite(env, maintenant))) return json({ error: 'Trop de demandes, réessayer plus tard' }, 429, cors);

  // Forme d'entrée documentée pour FLUX.2 via le binding : un formulaire multipart sérialisé.
  const form = new FormData();
  form.append('prompt', promptFinal(demande.prompt));
  form.append('width', String(demande.width));
  form.append('height', String(demande.height));
  const corpsForm = new Response(form);

  let image: string | undefined;
  try {
    const sortie = (await env.AI.run(MODELE_IMAGE, {
      multipart: { body: corpsForm.body, contentType: corpsForm.headers.get('content-type') ?? '' },
    })) as { image?: string } | null;
    image = sortie?.image;
  } catch (error: unknown) {
    console.error('Workers AI : génération refusée —', error);
    return json({ error: 'Génération impossible' }, 502, cors);
  }
  if (!image) return json({ error: 'Génération sans image' }, 502, cors);

  const octets = base64VersOctets(image);
  const type = typeImage(octets);
  if (!type) return json({ error: 'Image illisible' }, 502, cors);

  const key = `${PREFIXE_AI}${crypto.randomUUID()}.${type.ext}`;
  try {
    await env.BUCKET.put(key, octets, {
      httpMetadata: { contentType: type.mime, cacheControl: 'public, max-age=31536000, immutable' },
    });
  } catch (error: unknown) {
    console.error('Dépôt R2 de la photo générée impossible :', error);
    return json({ error: "Échec de l'enregistrement" }, 502, cors);
  }
  return json({ key, url: `${env.PUBLIC_MEDIA_BASE}/${key}`, width: demande.width, height: demande.height }, 200, cors);
}
