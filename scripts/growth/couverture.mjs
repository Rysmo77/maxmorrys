// Couvertures d'articles et de formations — charge render-card de la famille `couverture`.
//
// Décision de Max du 01/11/2026 : les couvertures du blog ET des formations sont rendues par
// render-card (kit DS du site), plus par Gemini Image. Deux modes :
//   - hybride (défaut) : photo de fond générée par Workers AI (FLUX.2 [dev]) à partir de
//     `fondPrompt`, ou fournie par URL (`fond`), sous un voile nuit teinté du territoire ;
//   - typographique : sans photo (repli automatique si la génération échoue).
//
// Format : 1200×630. C'est l'image de partage (og:image, JSON-LD) ET l'image principale :
// le site la recadre en 16:9 (`CoverImage`, `FormationCard`) et en vignettes jusqu'à ~1,5:1
// (index du blog) ; le gabarit garde tout son texte dans la zone qui survit à ces recadrages.
//
// ⛔ Règle éditoriale des photos : personnes FICTIVES, jamais présentées comme un client, un
// élève ou Max ; aucun texte, logo ni enseigne dans la photo (le Worker impose ce suffixe).
//
// Le nœud « Build — couverture » de WF-14 embarque une copie de `chargeFormation` et
// `promptFormation` : modifier ici, puis recopier dans le nœud (scripts/n8n-export-live.mjs).

/** Pôle du blog → territoire du site (couleur). Le blog vit en « je t'informe » ; un pôle prend
 *  la couleur de la piste où son sujet se pratique sur le site. */
export const POLE_TERRITOIRE = {
  'SEO & Visibilité': 'digitalise', // présence digitale, fiches, sites : Conception
  'E-commerce & Vente en ligne': 'digitalise', // boutiques, catalogues : Conception
  'IA & Automatisation': 'forme', // formations (Automatisation WhatsApp…) : Edu
  'Réseaux sociaux & Influence': 'transforme', // communauté, contenus : Club
  'Publicité en ligne': 'informe',
  'Business & Gestion': 'informe',
};

/** Scène de la photo par pôle : une situation de travail locale, sans écran lisible ni enseigne. */
const SCENES = {
  'SEO & Visibilité': 'a shop owner checking her business listing on a smartphone at the counter of a small, bright boutique in Dakar',
  'Publicité en ligne': 'a young entrepreneur reviewing an advertising campaign on a laptop in a bright co-working space in Dakar',
  'Réseaux sociaux & Influence': 'a content creator filming a short video with a smartphone on a small tripod in a sunny café in Dakar',
  'E-commerce & Vente en ligne': 'a seller preparing customer parcels next to a smartphone in a tidy small workshop in Dakar',
  'IA & Automatisation': 'an entrepreneur answering customer messages on a smartphone with a laptop open in a modern office in Dakar',
  'Business & Gestion': 'an entrepreneur reviewing accounts with a notebook, a calculator and a laptop in a modern office in Dakar',
};

const s = (v) => (v == null ? '' : String(v)).trim();

/** Titre de couverture : `coverTitle` s'il existe ; sinon, si le titre a la forme « Sujet : promesse »
 *  sans crochets, le sujet passe dans la couleur du territoire (convention `[mot]` des titres du site). */
export function titreCouverture(title, coverTitle) {
  if (s(coverTitle)) return s(coverTitle);
  const t = s(title);
  if (t.includes('[')) return t;
  const m = t.match(/^(.{2,48}?)\s+:\s+(.+)$/);
  return m ? `[${m[1]}] : ${m[2]}` : t;
}

const sansCrochets = (t) => s(t).replace(/[[\]]/g, '');

/** Prompt (anglais, déterministe) de la photo d'un article. */
export function promptArticle(title, pole) {
  const scene = SCENES[pole] || SCENES['Business & Gestion'];
  return [
    'Realistic editorial photograph for a business blog.',
    `Theme, never written in the image: ${sansCrochets(title)}.`,
    `Scene: ${scene}.`,
    'The person is fictional, West African, natural and confident, not looking at the camera.',
    'Subject centered in the frame, shallow depth of field, soft natural daylight, warm tones, modern and uncluttered, 35mm lens.',
    'Screens show only abstract shapes.',
  ].join(' ');
}

/** Prompt (anglais, déterministe) de la photo d'une formation. */
export function promptFormation(title) {
  return [
    'Realistic editorial photograph for an online course.',
    `Theme, never written in the image: ${sansCrochets(title)}.`,
    'Scene: a fictional West African learner practicing on a laptop and a smartphone at a bright desk in a modern space in Dakar, focused and confident.',
    'Subject centered in the frame, shallow depth of field, soft natural daylight, warm tones, uncluttered, 35mm lens.',
    'Screens show only abstract shapes.',
  ].join(' ');
}

/**
 * Charge render-card d'une couverture d'article.
 * @param {{title:string, category:string, coverTitle?:string, territoire?:string}} meta
 * @param {{fond?:string, photo?:boolean}} opts  fond = URL https d'une photo ; photo=false = typographique
 */
export function chargeArticle(meta, opts = {}) {
  const pole = s(meta.category);
  const p = {
    kit: 'ds', template: 'couverture', gabarit: 'couverture', variante: 'article', format: '1200x630',
    title: titreCouverture(meta.title, meta.coverTitle).slice(0, 140),
    eyebrow: pole,
    territoire: s(meta.coverTerritoire) || POLE_TERRITOIRE[pole] || 'informe',
  };
  if (/^https:\/\//.test(s(opts.fond))) p.fond = s(opts.fond);
  else if (opts.photo !== false) p.fondPrompt = promptArticle(meta.title, pole);
  return p;
}

/** Charge render-card d'une couverture de formation (territoire « je te forme »). */
export function chargeFormation(title, opts = {}) {
  const p = {
    kit: 'ds', template: 'couverture', gabarit: 'couverture', variante: 'formation', format: '1200x630',
    title: s(title).slice(0, 140), eyebrow: 'Formation', territoire: 'forme',
  };
  if (/^https:\/\//.test(s(opts.fond))) p.fond = s(opts.fond);
  else if (opts.photo !== false) p.fondPrompt = promptFormation(title);
  return p;
}
