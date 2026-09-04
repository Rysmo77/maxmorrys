/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALLÉGER LES IMAGES AVANT DE LES ENVOYER.
 *
 * Mesuré le 03/09/2026 sur les couvertures d'article réellement servies : des PNG de
 * 1408 × 768 pesant entre 643 et 847 Ko. Le même visuel en WebP tient autour de 100 Ko.
 *
 * CE QUE COÛTAIT L'ÉCART, ET À QUI. Une couverture est téléchargée trois fois pour une seule
 * lecture d'article : par la personne qui ouvre la page, par chaque robot qui construit
 * l'aperçu du lien, et à nouveau par chaque plateforme où il est partagé. Sur un marché où
 * deux gigaoctets coûtent 4,2 % du revenu national brut par habitant, sept cents kilooctets
 * d'écart par image ne sont pas une optimisation de confort.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS RÈGLES QUI ÉVITENT DE FAIRE PIRE.
 *
 *   1. On ne touche ni au GIF (la conversion perdrait l'animation), ni au SVG (c'est du
 *      vectoriel : le rasteriser le rendrait plus lourd ET flou).
 *   2. Si le WebP produit n'est pas PLUS PETIT que l'original, on garde l'original. Cela
 *      arrive sur les images déjà optimisées, et sur les très petites.
 *   3. Toute défaillance — navigateur sans WebP, image illisible, mémoire — rend le fichier
 *      d'origine. Un téléversement qui échoue parce que la compression a échoué serait un
 *      très mauvais échange.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Largeur maximale conservée.
 *
 * 1600 px et pas moins : une image de partage se déclare en 1200 px de large, et les écrans
 * denses en réclament davantage. Descendre sous 1200 dégraderait les aperçus qu'on vient de
 * réparer.
 */
const MAX_WIDTH = 1600;

/** Qualité WebP. Au-delà de 0,85 le gain de poids s'effondre sans gain visible. */
const QUALITY = 0.82;

/** En dessous, la conversion ne rapporte rien et coûte un décodage. */
const MIN_BYTES = 60 * 1024;

/** Types d'image que la conversion dégraderait au lieu de les alléger. */
const PRESERVED = new Set(['image/gif', 'image/svg+xml', 'image/avif', 'image/webp']);

/** Faut-il tenter la conversion ? Séparé du canevas pour être vérifiable en test. */
export function shouldCompress(type: string, bytes: number): boolean {
  if (!type.startsWith('image/')) return false;
  if (PRESERVED.has(type)) return false;
  return bytes >= MIN_BYTES;
}

/**
 * Remplace l'extension d'une clé de stockage.
 *
 * Sans cela, R2 recevrait des octets WebP sous une clé `.png`. Le type MIME resterait juste
 * — il est posé à part —, mais l'adresse publique mentirait sur son contenu, et c'est
 * exactement le genre d'écart qui égare la personne qui débogue six mois plus tard.
 */
export function withExtension(key: string, extension: string): string {
  return key.replace(/\.[^./]+$/, '') + `.${extension}`;
}

/** Dimensions de sortie : on réduit, jamais on n'agrandit. */
export function targetSize(
  width: number,
  height: number,
  maxWidth = MAX_WIDTH,
): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) };
}

export interface CompressedImage {
  blob: Blob;
  /** Extension correspondant au contenu rendu (`webp`, ou celle d'origine si inchangé). */
  extension: string;
  /** Faux quand l'original a été conservé — utile pour tracer sans deviner. */
  converted: boolean;
}

function extensionOf(type: string, fallback = 'jpg'): string {
  const subtype = type.split('/')[1]?.split('+')[0];
  if (!subtype) return fallback;
  return subtype === 'jpeg' ? 'jpg' : subtype;
}

/**
 * Convertit une image en WebP, en réduisant sa largeur si nécessaire.
 *
 * Rend TOUJOURS quelque chose d'envoyable : au pire, le fichier reçu.
 */
export async function compressImage(file: Blob): Promise<CompressedImage> {
  const original: CompressedImage = {
    blob: file,
    extension: extensionOf(file.type),
    converted: false,
  };

  if (!shouldCompress(file.type, file.size)) return original;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return original;

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = targetSize(bitmap.width, bitmap.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return original;
    context.drawImage(bitmap, 0, 0, width, height);

    const webp = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', QUALITY);
    });

    // `toBlob` rend `null` si le format est refusé, et peut rendre un PNG déguisé sur les
    // navigateurs sans encodeur WebP : on vérifie le type ET le gain avant d'accepter.
    if (!webp || webp.type !== 'image/webp' || webp.size >= file.size) return original;

    return { blob: webp, extension: 'webp', converted: true };
  } catch {
    return original;
  } finally {
    bitmap?.close();
  }
}
