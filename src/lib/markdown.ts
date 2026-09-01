import DOMPurify from 'dompurify';

/**
 * Rendu Markdown → HTML assaini.
 *
 * Module à part et non dans `lib/utils` : DOMPurify pèse 104 Ko bruts, et
 * `utils` est importé par le squelette de l'application pour `cn`, `formatPrice`
 * ou `debounce`. La bibliothèque se retrouvait donc dans le chunk d'entrée de
 * chaque visiteur, alors que `markdownToHtml` n'est appelé que par des routes
 * chargées à la demande (article, formation, podcast, vidéo, leçon, Club).
 */

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(trimmed)) return trimmed;
  return '#'; // protocole dangereux (javascript:, data:, vbscript:…) → lien neutre
}

/** Un lien qui reste sur le site ne s'ouvre pas dans un nouvel onglet. */
function isInternalUrl(url: string): boolean {
  return /^(\/|#)/.test(url.trim());
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Detecte si le contenu est deja du HTML (genere par Gemini ou colle dans l'editeur)
function isHtmlContent(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // Match les balises bloc courantes au debut, ou n'importe quelle balise sur la 1ere ligne
  return /^<(h[1-6]|p|div|section|article|ul|ol|figure|blockquote|pre|table|img|!--)\b/i.test(trimmed);
}

/*
 * LE MARQUEUR QUE LE GÉNÉRATEUR LAISSE DERRIÈRE LUI.
 *
 * Le flux n8n `WF-08` demande au modèle des liens internes sous la forme
 * `[LIEN_INTERNE : texte → /url]`, et personne ne les a jamais convertis : ils
 * s'affichaient tels quels, crochets compris, dans les articles publiés. Corriger le
 * prompt ne répare pas ce qui est déjà en base — la conversion vit donc ici, où elle
 * couvre les deux branches (markdown ET HTML déjà écrit).
 */
function resolveInternalLinkMarkers(input: string): string {
  return input.replace(
    /\[\s*LIEN_INTERNE\s*:\s*([^\]]+?)\s*(?:→|-&gt;|->|&rarr;)\s*([^\]\s]+)\s*\]/gi,
    (_m, texte: string, href: string) =>
      `<a href="${sanitizeUrl(href)}">${texte.replace(/[<>]/g, '')}</a>`,
  );
}

/*
 * LE `<h1>` DE TÊTE EST UN DOUBLON DU TITRE DE LA PAGE.
 *
 * Le même prompt demande un `content_html` qui commence par `<h1>…`, et la page rend
 * déjà le titre en tête (`SiteDisplay`). L'article affichait donc son titre deux fois,
 * et le document portait deux `<h1>` — ce qu'aucun outil du dépôt ne signalait.
 * Seul le PREMIER élément est retiré : un `<h1>` plus bas dans un texte est un choix
 * de l'auteur, pas un artefact de génération.
 */
function stripLeadingH1(html: string): string {
  return html.replace(/^\s*<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>\s*/i, '');
}

/** Le jeton qui met un bloc clôturé à l'abri des remplacements en ligne. */
const FENCE = 'mmfence';

/**
 * Rend UN bloc (ce qui vit entre deux lignes vides).
 *
 * ── LA LISTE N'A PAS À COMMENCER LE BLOC ────────────────────────────────────────────
 * La version précédente testait `/^- /` sur le bloc ENTIER : une liste précédée de sa
 * phrase d'introduction — « Voici les étapes :\n- un\n- deux », la façon dont on écrit
 * naturellement — retombait dans le cas `<p>`, et les tirets s'affichaient en clair.
 * On marche donc ligne à ligne : les suites de puces forment une liste, le reste forme
 * des paragraphes, et un bloc peut contenir les deux.
 *
 * Le retour à la ligne simple devient un `<br>` : il était purement et simplement
 * avalé, ce qui collait deux lignes voulues distinctes.
 *
 * Seul `-` ouvre une puce. `*` est laissé à l'italique : `*mot*` et `* item` ne se
 * distinguent pas sans un vrai analyseur, et l'italique est mille fois plus fréquent.
 */
function renderBlock(block: string): string {
  const out: string[] = [];
  let para: string[] = [];
  let liste: { tag: 'ul' | 'ol'; items: string[] } | null = null;

  const viderPara = () => {
    if (para.length) {
      out.push(`<p>${para.join('<br />')}</p>`);
      para = [];
    }
  };
  const viderListe = () => {
    if (liste) {
      out.push(`<${liste.tag}>${liste.items.map((i) => `<li>${i}</li>`).join('')}</${liste.tag}>`);
      liste = null;
    }
  };

  for (const ligne of block.split('\n')) {
    const t = ligne.trim();
    if (!t) continue;

    // Déjà balisé (titre produit plus haut, image, bloc clôturé mis de côté) : tel quel.
    if (t.startsWith(FENCE) || /^<(h[1-6]|img|ul|ol|blockquote|pre|figure|table|div|section|hr)/i.test(t)) {
      viderPara();
      viderListe();
      out.push(t);
      continue;
    }

    const puce = /^-\s+(.*)$/.exec(t);
    if (puce) {
      viderPara();
      if (liste?.tag !== 'ul') {
        viderListe();
        liste = { tag: 'ul', items: [] };
      }
      liste.items.push(puce[1]);
      continue;
    }

    const numero = /^\d+[.)]\s+(.*)$/.exec(t);
    if (numero) {
      viderPara();
      if (liste?.tag !== 'ol') {
        viderListe();
        liste = { tag: 'ol', items: [] };
      }
      liste.items.push(numero[1]);
      continue;
    }

    viderListe();
    para.push(t);
  }

  viderPara();
  viderListe();
  return out.join('');
}

function renderMarkdown(md: string): string {
  const blocsCloture: string[] = [];

  // 1 · LES BLOCS CLÔTURÉS SORTENT EN PREMIER. Sans quoi les remplacements en ligne
  //     (gras, italique, liens) s'appliqueraient au code qu'on cite, et un `**` dans un
  //     extrait de source deviendrait du gras.
  let src = md
    .replace(/\r\n?/g, '\n')
    .replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_m, langue: string, code: string) => {
      const classe = /^[A-Za-z0-9+#-]+$/.test(langue.trim()) ? ` class="language-${langue.trim()}"` : '';
      const i =
        blocsCloture.push(`<pre><code${classe}>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`) - 1;
      return `\n\n${FENCE}${i}\n\n`;
    });

  // 2 · Les titres, du plus profond au moins profond — sinon `###` serait mangé par `#`.
  src = src
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\s*(?:---+|\*\*\*+|___+)\s*$/gm, '<hr />');

  // 3 · Les remplacements en ligne.
  src = src
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_m, alt: string, source: string) =>
        `<img src="${sanitizeUrl(source)}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`,
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => {
      const url = sanitizeUrl(href);
      // `target="_blank"` était posé sur TOUS les liens, internes compris : un lien vers
      // une autre page du site ouvrait un second onglet du même site.
      const cible = isInternalUrl(url) ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `<a href="${url}"${cible}>${text}</a>`;
    });

  // 4 · Les blocs.
  const rendu = src
    .split('\n\n')
    .map((bloc) => {
      const t = bloc.trim();
      if (!t) return '';
      // La citation : toutes ses lignes portent `>`, qu'on retire avant de rendre le
      // contenu — une citation peut contenir des paragraphes et des puces.
      if (/^>/.test(t)) {
        const dedans = t
          .split('\n')
          .map((l) => l.replace(/^\s*>\s?/, ''))
          .join('\n');
        return `<blockquote>${renderBlock(dedans)}</blockquote>`;
      }
      return renderBlock(bloc);
    })
    .filter(Boolean)
    .join('\n');

  // 5 · Restitution des blocs clôturés.
  return rendu.replace(new RegExp(`${FENCE}(\\d+)`, 'g'), (_m, i: string) => blocsCloture[Number(i)] ?? '');
}

/**
 * LA CONVERSION SEULE, SANS ASSAINISSEMENT — exportée pour être testable.
 *
 * DOMPurify a besoin d'un DOM, et les suites du dépôt tournent sous Node sans jsdom.
 * Sortir la conversion permet de verrouiller chaque règle de rendu par un test, ce que
 * `markdownToHtml` interdisait : c'est précisément parce que rien ne la testait que les
 * citations, les blocs de code et les listes précédées d'une phrase manquaient sans que
 * personne le voie.
 *
 * ⚠️ Le HTML qui sort d'ici N'EST PAS SÛR. Le seul appelant légitime en production est
 * `markdownToHtml`, qui l'assainit. Ne jamais le passer à `dangerouslySetInnerHTML`.
 */
export function markdownToRawHtml(md: string): string {
  if (!md) return '';
  // Si le contenu est deja du HTML, on bypass le parsing markdown.
  return stripLeadingH1(resolveInternalLinkMarkers(isHtmlContent(md) ? md : renderMarkdown(md)));
}

export function markdownToHtml(md: string): string {
  if (!md) return '';

  const raw = markdownToRawHtml(md);

  // Whitelist large : on s'appuie sur la liste safe par défaut de DOMPurify
  // (couvre toutes les balises HTML standard sauf script/style/iframe/etc.),
  // qu'on étend aux quelques balises sémantiques utiles, et on autorise tous
  // les attributs HTML/data/ARIA standards via ALLOW_DATA_ATTR + ALLOW_ARIA_ATTR.
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['figure', 'figcaption', 'picture', 'source', 'details', 'summary', 'mark', 'kbd', 'samp', 'var', 'time', 'address', 'abbr', 'cite', 'dfn', 'sub', 'sup'],
    ADD_ATTR: ['class', 'style', 'target', 'rel', 'loading', 'colspan', 'rowspan', 'datetime', 'cite', 'open', 'controls', 'autoplay', 'muted', 'loop', 'poster', 'preload', 'srcset', 'sizes', 'media'],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
  });
}

/** Une entrée du sommaire d'article : l'ancre posée dans le corps, et son libellé. */
export interface ArticleHeading {
  id: string;
  text: string;
  /** 2 ou 3 — le sommaire met les sous-titres en retrait plutôt que de les aplatir. */
  level: 2 | 3;
}

/**
 * POSE LES ANCRES DE SOMMAIRE, ET REND LA LISTE DES TITRES.
 *
 * Le kit compose la colonne latérale d'un article en DEUX panneaux : « Dans cet article »
 * puis la passerelle vers la formation (`ui_kits/site-public/PagesCore.js:166-174`).
 *
 * POURQUOI `h2` ET `h3`. La version précédente n'indexait que les `<h2>`, alors que
 * l'éditeur propose les deux niveaux : un article écrit en `###` n'avait AUCUNE entrée,
 * donc pas de sommaire du tout — et comme la prose d'article n'était pas mise en forme,
 * rien à l'écran ne distinguait un h2 d'un h3 pour ramener l'auteur vers le bon niveau.
 * Les deux défauts se cachaient l'un l'autre.
 *
 * POURQUOI SUR LE HTML RENDU, ET NON SUR LA SOURCE. `markdownToHtml` a deux entrées : du
 * markdown, et du HTML déjà écrit (Gemini, ou collé dans l'éditeur — voir `isHtmlContent`).
 * Chercher `^## ` dans la source ne verrait donc rien sur la moitié des articles, et le défaut
 * serait invisible pour qui n'ouvre que des articles de l'autre moitié.
 *
 * L'ANCRE EST AJOUTÉE APRÈS L'ASSAINISSEMENT, et c'est délibéré : `id` n'est pas dans
 * `ADD_ATTR`, donc DOMPurify le retirerait. La valeur n'est jamais celle de l'auteur — elle
 * est dérivée du texte, translittérée, préfixée, et bornée à ce qui peut vivre dans une URL.
 * Un `id` déjà présent sur le titre est retiré : deux attributs `id` sur la même balise, et
 * c'est l'analyseur du navigateur qui arbitre en silence lequel gagne.
 *
 * POURQUOI `tabindex="-1"` SUR LE TITRE. Quand on suit une ancre, le navigateur ne déplace
 * le focus que si la cible peut le recevoir. Sans cet attribut, la personne au clavier
 * cliquait une entrée du sommaire, la page défilait, et sa tabulation suivante repartait du
 * HAUT de la page — elle relisait la barre de navigation à chaque section. `-1` rend le titre
 * focalisable sans l'ajouter à l'ordre de tabulation, et laisse le navigateur faire le reste :
 * pas une ligne de JavaScript, donc rien à désynchroniser avec l'historique ni avec le
 * défilement doux, que `prefers-reduced-motion` désarme déjà (`brand/fallback.css`).
 */
export function withArticleToc(html: string): { html: string; headings: ArticleHeading[] } {
  const headings: ArticleHeading[] = [];
  const vus = new Map<string, number>();

  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (balise, niveau: string, attrs: string | undefined, dedans: string) => {
    // Le libellé est le TEXTE : un titre peut porter du gras ou un lien.
    const text = dedans.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!text) return balise;

    // Le repli porte sur le RADICAL, pas sur le gabarit : `` `mm-h-${''}` `` vaut « mm-h- »,
    // qui est vrai — un `|| 'mm-h'` posé sur le gabarit ne se déclenche donc jamais, et un
    // titre sans caractère latin (« ??? », « 你好 ») produit l'ancre « mm-h- » pour tout le
    // monde. Le dédoublonnage la sauve, mais l'adresse ne dit plus rien de la section.
    const radical =
      text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')   // les accents ne survivent pas à un fragment d'URL
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
    const base = radical ? `mm-h-${radical}` : 'mm-h';

    // Deux sections peuvent porter le même titre ; deux ancres identiques n'en font qu'une,
    // et le second lien renverrait au premier titre sans que rien ne le signale.
    const n = (vus.get(base) ?? 0) + 1;
    vus.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;

    const reste = (attrs ?? '')
      .replace(/\sid\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\stabindex\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    headings.push({ id, text, level: niveau === '3' ? 3 : 2 });
    return `<h${niveau} id="${id}" tabindex="-1"${reste}>${dedans}</h${niveau}>`;
  });

  return { html: out, headings };
}
