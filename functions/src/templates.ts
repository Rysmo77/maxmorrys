/**
 * Templates de cartes réseaux sociaux (HTML/CSS -> Satori).
 * Direction « signature courbe de marque » (Brand Kit Max-Morrys) :
 * courbe de croissance bleu→orange (SVG), dégradés de marque, halo radial, Merriweather + Inter,
 * eyebrow (pilier), mot-clé surligné, mode fond-image (photo/IA) avec scrim dégradé.
 * Contrainte Satori : flexbox uniquement, pas de filter/blur/mask ; gradients + <svg> inline OK.
 */

export type TemplateName =
  | 'quote' | 'tip' | 'promo' | 'poster' | 'panel'
  // Gabarits « aplat » ajoutés pour la stratégie 2026 S2 (docs/STRATEGIE_COMMUNICATION_2026.md).
  // Ils se rendent SANS fond image : plus rapides, moins chers, aucune dépendance externe.
  | 'slide' | 'stat' | 'checklist' | 'versus' | 'ask' | 'testimonial';
export type CardFormat = '1:1' | '4:5' | '9:16';
export type AccentName = 'brand' | 'orange' | 'violet' | 'turquoise' | 'corail' | 'vert' | 'accent';
/** Rôle d'une slide dans un carrousel : la promesse, une idée, le récap. */
export type SlideRole = 'cover' | 'body' | 'outro';

export interface CardPayload {
  template: TemplateName;
  format: CardFormat;
  title: string;
  body?: string;
  cta?: string;
  eyebrow?: string; // libellé (souvent le Pilier ou la Série) — petites capitales
  highlight?: string; // fragment du titre à surligner en accent
  accent?: AccentName;
  backgroundUrl?: string;
  curve?: boolean; // courbe signature (défaut true) ; false = look moins « template »

  // ── `slide` — un appel par slide de carrousel ──
  slideRole?: SlideRole; // défaut 'body'
  slideIndex?: number; // 1-indexé
  slideTotal?: number;

  // ── `stat` — un très grand chiffre ──
  stat?: string; // ex. '+1 790 %'
  statLabel?: string; // ex. 'de trafic en 18 mois'

  // ── `checklist` — 3 à 6 items numérotés ──
  items?: string[];

  // ── `versus` — deux colonnes ──
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];

  // ── `ask` — story : question ou sondage ──
  options?: string[];

  // ── `testimonial` ──
  authorName?: string;
  authorRole?: string;
}

// Tokens couleurs officiels (brand-tokens.json)
const C = {
  bleuProfond: '#072B49',
  bleuPrincipal: '#0074C5',
  bleuVif: '#0C93E7',
  bleuTresClair: '#F0F7FF',
  orange: '#ED9516',
  violet: '#8A3DE8',
  turquoise: '#08BDAA',
  corail: '#FA5A2E',
  vert: '#22C55E',
  textePrincipal: '#071B3A',
  texteSecondaire: '#52627A',
  blanc: '#FFFFFF',
};

const ACCENTS: Record<string, string> = {
  brand: C.bleuPrincipal, orange: C.orange, accent: C.orange, violet: C.violet,
  turquoise: C.turquoise, corail: C.corail, vert: C.vert,
};

// Dégradés de marque (brand-tokens.json)
const GRAD = {
  institutionnel: `linear-gradient(145deg, ${C.bleuProfond} 0%, #0a3a63 55%, ${C.bleuPrincipal} 130%)`,
  innovation: `linear-gradient(150deg, #0a1f3a 0%, ${C.violet} 115%, ${C.turquoise} 180%)`,
  energie: `linear-gradient(150deg, ${C.bleuProfond} 0%, #7a2f1e 130%, ${C.corail} 175%)`,
  croissance: `linear-gradient(150deg, ${C.bleuProfond} 0%, #0a5f57 120%, ${C.turquoise} 175%)`,
};

const FONT_TITLE = 'Merriweather';
const FONT_BODY = 'Inter';

function esc(s: string): string {
  // Satori/satori-html rend le texte LITTÉRALEMENT (ne décode pas les entités HTML) → ne pas convertir
  // en &amp; (sinon "Q&A" s'affiche "Q&amp;A"). On neutralise seulement < > (qui casseraient le markup).
  return (s || '').replace(/</g, '‹').replace(/>/g, '›');
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function titleSize(text: string, h: number): number {
  const base = h >= 1900 ? 84 : h >= 1300 ? 72 : 64;
  const len = (text || '').length;
  if (len > 150) return Math.round(base * 0.6);
  if (len > 100) return Math.round(base * 0.72);
  if (len > 64) return Math.round(base * 0.85);
  return base;
}

function accentColor(p: CardPayload): string {
  return ACCENTS[p.accent || 'orange'] || C.orange;
}

/** Courbe de croissance signature (SVG inline) : trait bleu→orange + aire douce + point de tête. */
function growthCurve(w: number, h: number, accent: string, opacity: number): string {
  const ch = Math.round(h * 0.34);
  const y = (f: number) => Math.round(ch * f);
  const x = (f: number) => Math.round(w * f);
  const line = `M0 ${y(0.74)} C ${x(0.30)} ${y(0.82)}, ${x(0.40)} ${y(0.44)}, ${x(0.62)} ${y(0.48)} S ${x(0.9)} ${y(0.12)}, ${w} ${y(0.08)}`;
  const area = `${line} L ${w} ${ch} L 0 ${ch} Z`;
  const svg =
    `<svg width="${w}" height="${ch}" viewBox="0 0 ${w} ${ch}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs>` +
    `<linearGradient id="mmline" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="${C.bleuPrincipal}"/><stop offset="0.82" stop-color="${C.bleuVif}"/><stop offset="0.94" stop-color="${C.orange}"/><stop offset="1" stop-color="${C.orange}"/>` +
    `</linearGradient>` +
    `<linearGradient id="mmarea" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${accent}" stop-opacity="0.30"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<path d="${area}" fill="url(#mmarea)"/>` +
    `<path d="${line}" fill="none" stroke="url(#mmline)" stroke-width="${Math.round(w * 0.008)}" stroke-linecap="round"/>` +
    `<circle cx="${x(0.985)}" cy="${y(0.08)}" r="${Math.round(w * 0.012)}" fill="${C.orange}"/>` +
    `</svg>`;
  return `<div style="display:flex;position:absolute;left:0;bottom:0;width:${w}px;height:${ch}px;opacity:${opacity};">${svg}</div>`;
}

/** Titre avec mot-clé surligné (mots de `highlight` passés en accent). Police paramétrable. */
function titleBlock(p: CardPayload, size: number, color: string, accent: string, font: string = FONT_TITLE): string {
  const words = (p.title || '').split(/\s+/).filter(Boolean);
  const hl = new Set((p.highlight || '').toLowerCase().split(/\s+/).filter(Boolean));
  const norm = (s: string) => s.replace(/[.,!?;:«»"'()]/g, '').toLowerCase();
  const rg = Math.round(size * 0.16), cg = Math.round(size * 0.26);
  // Sur fond sombre, un accent bleu ressort mal → surligne en orange pour le peps.
  const hlCol = accent === C.bleuPrincipal ? C.orange : accent;
  const spans = words
    .map((wd) => `<div style="display:flex;color:${hl.has(norm(wd)) ? hlCol : color};">${esc(wd)}</div>`)
    .join('');
  return `<div style="display:flex;flex-wrap:wrap;gap:${rg}px ${cg}px;font-size:${size}px;font-weight:900;line-height:1;font-family:${font};">${spans}</div>`;
}

function eyebrowBlock(text: string, accent: string): string {
  if (!text) return '';
  return (
    `<div style="display:flex;align-items:center;">` +
    `<div style="display:flex;width:44px;height:5px;border-radius:3px;background:${accent};margin-right:20px;"></div>` +
    `<div style="display:flex;color:${accent};font-size:28px;font-weight:800;letter-spacing:5px;font-family:${FONT_BODY};">${esc((text || '').toUpperCase())}</div>` +
    `</div>`
  );
}

function footer(p: CardPayload, color: string, sub: string, logo?: string): string {
  const acc = accentColor(p);
  const logoImg = logo
    ? `<img src="${logo}" width="60" height="60" style="width:60px;height:60px;margin-right:20px;" />`
    : `<div style="display:flex;width:18px;height:18px;border-radius:9px;background:${acc};margin-right:16px;"></div>`;
  return (
    `<div style="display:flex;flex-direction:column;">` +
    `<div style="display:flex;width:100%;height:2px;background:${hexToRgba(color === C.texteSecondaire ? C.textePrincipal : C.blanc, 0.14)};margin-bottom:26px;"></div>` +
    `<div style="display:flex;align-items:center;">` +
    logoImg +
    `<div style="display:flex;color:${color};font-size:30px;font-weight:700;font-family:${FONT_BODY};">${esc(sub)}</div>` +
    `</div>` +
    `</div>`
  );
}

function pill(text: string, bg: string, fg: string): string {
  return `<div style="display:flex;align-self:flex-start;background:${bg};color:${fg};font-size:36px;font-weight:800;padding:22px 50px;border-radius:999px;box-shadow:0 12px 30px ${hexToRgba(C.bleuProfond, 0.25)};font-family:${FONT_BODY};">${esc(text)}</div>`;
}

/**
 * Coque : deux modes.
 *  - marque : fond dégradé + halo radial d'accent + courbe.
 *  - image  : photo plein cadre + scrim dégradé bleu + courbe subtile.
 */
function shell(w: number, h: number, pad: number, grad: string, accent: string, contentInner: string, bgUri?: string, curve: boolean = true): string {
  let bgLayers: string;
  if (bgUri) {
    bgLayers =
      `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;">` +
      `<img src="${bgUri}" width="${w}" height="${h}" style="width:${w}px;height:${h}px;object-fit:cover;" /></div>` +
      `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;background:linear-gradient(to top, ${C.bleuProfond} 4%, ${hexToRgba(C.bleuProfond, 0.66)} 44%, ${hexToRgba(C.bleuProfond, 0.14)} 100%);"></div>` +
      (curve ? growthCurve(w, h, accent, 0.35) : '');
  } else {
    bgLayers =
      `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;background:radial-gradient(circle at 82% 14%, ${hexToRgba(accent, 0.42)} 0%, ${hexToRgba(accent, 0)} 52%);"></div>` +
      (curve ? growthCurve(w, h, accent, 0.55) : '');
  }
  const base = bgUri ? C.bleuProfond : grad;
  return (
    `<div style="display:flex;position:relative;width:${w}px;height:${h}px;background:${base};">` +
    bgLayers +
    `<div style="display:flex;flex-direction:column;justify-content:space-between;position:relative;width:${w}px;height:${h}px;padding:${pad}px;">` +
    contentInner +
    `</div></div>`
  );
}

function quoteTpl(p: CardPayload, w: number, h: number, pad: number, bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const body = p.body
    ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.82)};font-size:40px;font-weight:400;line-height:1.4;margin-top:34px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
    : '';
  const inner =
    `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || '', acc) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    `<div style="display:flex;color:${acc};font-size:150px;font-weight:900;line-height:0.6;height:96px;font-family:${FONT_TITLE};">“</div>` +
    titleBlock(p, titleSize(p.title, h), C.blanc, acc) + body +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo);
  return shell(w, h, pad, GRAD.institutionnel, acc, inner, bg, p.curve !== false);
}

function tipTpl(p: CardPayload, w: number, h: number, pad: number, bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const body = p.body
    ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.8)};font-size:40px;font-weight:400;line-height:1.42;margin-top:30px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
    : '';
  const inner =
    `<div style="display:flex;flex-direction:column;">` + pill((p.eyebrow || 'ASTUCE').toUpperCase(), acc, C.blanc) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    titleBlock(p, titleSize(p.title, h), C.blanc, acc) + body +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo);
  return shell(w, h, pad, GRAD.innovation, acc, inner, bg, p.curve !== false);
}

function promoTpl(p: CardPayload, w: number, h: number, pad: number, bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const body = p.body
    ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.85)};font-size:42px;font-weight:400;line-height:1.4;margin-top:28px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
    : '';
  const cta = p.cta ? pill(p.cta, acc, C.bleuProfond) : '';
  const inner =
    `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || '', acc) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    titleBlock(p, titleSize(p.title, h), C.blanc, acc) + body +
    `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    (cta ? `<div style="display:flex;margin-bottom:34px;">${cta}</div>` : '') +
    footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo) +
    `</div>`;
  return shell(w, h, pad, GRAD.energie, acc, inner, bg, p.curve !== false);
}

/**
 * Coque « aplat » (famille poster) : fond bleu profond plein, barre d'accent verticale à gauche,
 * aucun fond photo, aucune courbe. `deco` reçoit les formes décoratives propres au gabarit.
 * C'est le socle commun de tous les gabarits ajoutés en 2026 S2.
 */
function flatShell(w: number, h: number, pad: number, acc: string, inner: string, deco = ''): string {
  return (
    `<div style="display:flex;position:relative;width:${w}px;height:${h}px;background:${C.bleuProfond};">` +
    deco +
    // barre d'accent verticale à gauche = ancrage éditorial
    `<div style="display:flex;position:absolute;left:0;top:0;width:${Math.round(w * 0.03)}px;height:${h}px;background:${acc};"></div>` +
    `<div style="display:flex;flex-direction:column;justify-content:space-between;position:relative;width:${w}px;height:${h}px;padding:${pad}px;">` +
    inner +
    `</div></div>`
  );
}

/** Gros disque d'accent en bas-droite, partiellement hors cadre = signal graphique fort. */
function accentDisc(w: number, h: number, acc: string): string {
  const blob = Math.round(w * 0.9);
  return `<div style="display:flex;position:absolute;left:${w - Math.round(blob * 0.42)}px;top:${h - Math.round(blob * 0.5)}px;width:${blob}px;height:${blob}px;border-radius:${Math.round(blob / 2)}px;background:${hexToRgba(acc, 0.9)};"></div>`;
}

/** Paragraphe de corps sur fond sombre — même rendu partout. */
function bodyBlock(text: string | undefined, size = 40, opacity = 0.86, marginTop = 34): string {
  if (!text) return '';
  return `<div style="display:flex;color:${hexToRgba(C.blanc, opacity)};font-size:${size}px;font-weight:500;line-height:1.42;margin-top:${marginTop}px;font-family:${FONT_BODY};">${esc(text)}</div>`;
}

/**
 * Poster typographique : aplats de couleur, très grande typo Inter (sans-serif, « style plus fort »),
 * bloc géométrique d'accent, PAS de photo, PAS de courbe, PAS de dégradé flou. Look éditorial affiché.
 */
function posterTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const size = Math.round(titleSize(p.title, h) * 1.08);
  const inner =
    `<div style="display:flex;flex-direction:column;">` + pill((p.eyebrow || 'MAX-MORRYS').toUpperCase(), acc, C.bleuProfond) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    titleBlock(p, size, C.blanc, acc, FONT_BODY) + bodyBlock(p.body, 40, 0.86) +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo);
  return flatShell(w, h, pad, acc, inner, accentDisc(w, h, acc));
}

/**
 * Panel « couverture magazine » : photo en haut, panneau de couleur pleine en bas portant le texte
 * (sans-serif Inter). Franchement différent du photo-plein-cadre (A) et du poster flat (C).
 */
function panelTpl(p: CardPayload, w: number, h: number, pad: number, bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const photoH = Math.round(h * 0.5);
  const size = Math.round(titleSize(p.title, h) * 0.86);
  const photo = bg
    ? `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${photoH}px;">` +
      `<img src="${bg}" width="${w}" height="${photoH}" style="width:${w}px;height:${photoH}px;object-fit:cover;" /></div>`
    : `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${photoH}px;background:${GRAD.institutionnel};"></div>`;
  const body = p.body
    ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.82)};font-size:38px;font-weight:500;line-height:1.4;margin-top:26px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
    : '';
  const panel =
    `<div style="display:flex;flex-direction:column;justify-content:flex-end;position:absolute;top:${photoH}px;left:0;width:${w}px;height:${h - photoH}px;background:${C.bleuProfond};padding:${pad}px;">` +
    // filet d'accent en haut du panneau (couture éditoriale)
    `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${Math.round(h * 0.008)}px;background:${acc};"></div>` +
    `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || '', acc) + `</div>` +
    `<div style="display:flex;flex-direction:column;margin-top:22px;">` +
    titleBlock(p, size, C.blanc, acc, FONT_BODY) + body +
    `</div>` +
    `<div style="display:flex;margin-top:30px;">` + footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo) + `</div>` +
    `</div>`;
  return `<div style="display:flex;position:relative;width:${w}px;height:${h}px;background:${C.bleuProfond};">${photo}${panel}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gabarits « aplat » — stratégie 2026 S2. Tous rendus SANS fond image.
// ─────────────────────────────────────────────────────────────────────────────

/** « 03 / 08 » + barre de progression : le lecteur sait toujours où il en est dans le carrousel. */
function slideProgress(index: number, total: number, acc: string, w: number): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const trackW = Math.round(w * 0.34);
  const doneW = Math.max(1, Math.round((trackW * Math.min(index, total)) / Math.max(total, 1)));
  return (
    `<div style="display:flex;align-items:center;">` +
    `<div style="display:flex;color:${acc};font-size:30px;font-weight:800;letter-spacing:3px;margin-right:24px;font-family:${FONT_BODY};">${pad2(index)} / ${pad2(total)}</div>` +
    `<div style="display:flex;position:relative;width:${trackW}px;height:6px;border-radius:3px;background:${hexToRgba(C.blanc, 0.2)};">` +
    `<div style="display:flex;position:absolute;left:0;top:0;width:${doneW}px;height:6px;border-radius:3px;background:${acc};"></div>` +
    `</div></div>`
  );
}

/**
 * Slide de carrousel. Une slide = un appel. Trois rôles :
 *  - `cover` : la promesse, en très grand, plus l'invitation à faire défiler ;
 *  - `body`  : une seule idée ;
 *  - `outro` : le récap et l'unique CTA.
 */
function slideTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const role: SlideRole = p.slideRole || 'body';
  const index = p.slideIndex || 1;
  const total = p.slideTotal || 1;
  const isCover = role === 'cover';
  const isOutro = role === 'outro';

  const size = Math.round(titleSize(p.title, h) * (isCover ? 1.15 : 0.86));
  const head = isCover
    ? `<div style="display:flex;flex-direction:column;">${pill((p.eyebrow || 'MAX-MORRYS').toUpperCase(), acc, C.bleuProfond)}</div>`
    : `<div style="display:flex;flex-direction:column;">${slideProgress(index, total, acc, w)}</div>`;

  // La cover invite à faire défiler ; l'outro porte le CTA ; les slides du milieu ne portent rien.
  const tail = isCover
    // « » » plutôt que « → » : le sous-ensemble Inter embarqué est latin, et U+2192 s'y rend en tofu.
    ? `<div style="display:flex;color:${acc};font-size:34px;font-weight:800;letter-spacing:2px;font-family:${FONT_BODY};">FAIS DÉFILER »</div>`
    : isOutro
      ? `<div style="display:flex;flex-direction:column;">` +
        (p.cta ? `<div style="display:flex;margin-bottom:34px;">${pill(p.cta, acc, C.bleuProfond)}</div>` : '') +
        footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo) +
        `</div>`
      : `<div style="display:flex;color:${hexToRgba(C.blanc, 0.55)};font-size:28px;font-weight:700;letter-spacing:3px;font-family:${FONT_BODY};">MAXMORRYS.ME</div>`;

  const inner =
    head +
    `<div style="display:flex;flex-direction:column;">` +
    titleBlock(p, size, C.blanc, acc, FONT_BODY) +
    bodyBlock(p.body, isCover ? 42 : 38, 0.84, 30) +
    `</div>` +
    tail;
  // Seule la cover porte le disque : les slides du milieu restent sobres et lisibles.
  return flatShell(w, h, pad, acc, inner, isCover ? accentDisc(w, h, acc) : '');
}

/** Un très grand chiffre, son libellé, son contexte. Pour la série PREUVE. */
function statTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const value = p.stat || p.title || '';
  // Le chiffre doit tenir sur UNE ligne : « +1 790 % » qui passe à la ligne perd tout son effet.
  // On dimensionne d'après la largeur disponible plutôt qu'avec des paliers approximatifs —
  // en Inter 900, un glyphe fait ~0,62 em de large.
  const statSize = Math.max(
    72,
    Math.round(Math.min(h >= 1900 ? 300 : h >= 1300 ? 250 : 220, (w - 2 * pad) / (Math.max(value.length, 1) * 0.62)))
  );
  const label = p.statLabel
    ? `<div style="display:flex;color:${C.blanc};font-size:52px;font-weight:800;line-height:1.15;margin-top:18px;font-family:${FONT_BODY};">${esc(p.statLabel)}</div>`
    : '';
  const inner =
    `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || 'PREUVE', acc) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    `<div style="display:flex;color:${acc};font-size:${statSize}px;font-weight:900;line-height:0.92;font-family:${FONT_BODY};">${esc(value)}</div>` +
    label + bodyBlock(p.body, 38, 0.8, 28) +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo);
  return flatShell(w, h, pad, acc, inner, accentDisc(w, h, acc));
}

/** 3 à 6 items numérotés. Pour la série ATELIER — `eyebrow` porte le nom de l'outil. */
function checklistTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const items = (p.items || []).slice(0, 6);
  const dot = Math.round(w * 0.062);
  // Plus il y a d'items, plus on resserre : 3 items respirent, 6 items doivent tenir.
  const itemSize = items.length >= 6 ? 34 : items.length >= 5 ? 38 : 42;
  const rows = items
    .map(
      (it, i) =>
        `<div style="display:flex;align-items:center;margin-top:${i === 0 ? 0 : Math.round(dot * 0.42)}px;">` +
        `<div style="display:flex;align-items:center;justify-content:center;width:${dot}px;height:${dot}px;border-radius:${Math.round(dot / 2)}px;background:${acc};color:${C.bleuProfond};font-size:${Math.round(dot * 0.46)}px;font-weight:900;margin-right:${Math.round(dot * 0.42)}px;font-family:${FONT_BODY};">${i + 1}</div>` +
        `<div style="display:flex;flex:1;color:${C.blanc};font-size:${itemSize}px;font-weight:600;line-height:1.28;font-family:${FONT_BODY};">${esc(it)}</div>` +
        `</div>`
    )
    .join('');
  const inner =
    `<div style="display:flex;flex-direction:column;">` +
    pill((p.eyebrow || 'ATELIER').toUpperCase(), acc, C.bleuProfond) +
    `<div style="display:flex;margin-top:30px;">${titleBlock(p, Math.round(titleSize(p.title, h) * 0.78), C.blanc, acc, FONT_BODY)}</div>` +
    `</div>` +
    `<div style="display:flex;flex-direction:column;">${rows}</div>` +
    footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo);
  return flatShell(w, h, pad, acc, inner);
}

/** Deux colonnes face à face : avant/après, mythe/réalité, sans/avec. PREUVE et RADAR. */
function versusTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  // Les deux colonnes partagent le MÊME fond neutre : teinter la colonne « après » avec l'accent
  // donnait un gris boueux dès que l'accent est chaud (orange sur bleu profond = désaturation).
  // La hiérarchie passe donc par la couleur du titre et du filet, pas par le fond.
  const col = (heading: string, items: string[], color: string, bg: string) =>
    `<div style="display:flex;flex-direction:column;flex:1;background:${bg};border-radius:28px;padding:${Math.round(pad * 0.62)}px;">` +
    `<div style="display:flex;color:${color};font-size:40px;font-weight:900;line-height:1.1;font-family:${FONT_BODY};">${esc(heading)}</div>` +
    `<div style="display:flex;width:56px;height:5px;border-radius:3px;background:${color};margin-top:16px;margin-bottom:26px;"></div>` +
    items
      .slice(0, 5)
      .map(
        (it, i) =>
          `<div style="display:flex;color:${hexToRgba(C.blanc, 0.9)};font-size:32px;font-weight:500;line-height:1.3;margin-top:${i === 0 ? 0 : 20}px;font-family:${FONT_BODY};">${esc(it)}</div>`
      )
      .join('') +
    `</div>`;
  const inner =
    `<div style="display:flex;flex-direction:column;">` +
    eyebrowBlock(p.eyebrow || '', acc) +
    `<div style="display:flex;margin-top:26px;">${titleBlock(p, Math.round(titleSize(p.title, h) * 0.72), C.blanc, acc, FONT_BODY)}</div>` +
    `</div>` +
    `<div style="display:flex;flex-direction:row;">` +
    col(p.leftTitle || 'AVANT', p.leftItems || [], hexToRgba(C.blanc, 0.5), hexToRgba(C.blanc, 0.05)) +
    `<div style="display:flex;width:${Math.round(pad * 0.4)}px;"></div>` +
    col(p.rightTitle || 'APRÈS', p.rightItems || [], acc, hexToRgba(C.blanc, 0.11)) +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo);
  return flatShell(w, h, pad, acc, inner);
}

/**
 * Story : question ou sondage, en 9:16.
 * L'interface Instagram recouvre le haut (photo de profil) et le bas (barre de réponse) : sans
 * marges réservées, la moitié des stories sortent tronquées. On réserve ~13 % en haut et ~16 % en bas.
 */
function askTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const safeTop = Math.round(h * 0.13);
  const safeBottom = Math.round(h * 0.16);
  const options = (p.options || []).slice(0, 4);
  const opts = options.length
    ? `<div style="display:flex;flex-direction:column;margin-top:56px;">` +
      options
        .map(
          (o, i) =>
            `<div style="display:flex;align-items:center;justify-content:center;background:${i === 0 ? acc : hexToRgba(C.blanc, 0.12)};color:${i === 0 ? C.bleuProfond : C.blanc};font-size:44px;font-weight:800;padding:30px 40px;border-radius:999px;margin-top:${i === 0 ? 0 : 24}px;font-family:${FONT_BODY};">${esc(o)}</div>`
        )
        .join('') +
      `</div>`
    : '';
  const inner =
    `<div style="display:flex;flex-direction:column;">` + pill((p.eyebrow || 'MAX-MORRYS').toUpperCase(), acc, C.bleuProfond) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    titleBlock(p, Math.round(titleSize(p.title, h) * 0.92), C.blanc, acc, FONT_BODY) +
    bodyBlock(p.body, 40, 0.84, 28) + opts +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo);
  return (
    `<div style="display:flex;position:relative;width:${w}px;height:${h}px;background:${C.bleuProfond};">` +
    accentDisc(w, h, acc) +
    `<div style="display:flex;position:absolute;left:0;top:0;width:${Math.round(w * 0.03)}px;height:${h}px;background:${acc};"></div>` +
    `<div style="display:flex;flex-direction:column;justify-content:space-between;position:relative;width:${w}px;height:${h}px;` +
    `padding:${safeTop}px ${pad}px ${safeBottom}px ${pad}px;">` +
    inner +
    `</div></div>`
  );
}

/** Citation + auteur + rôle. Preuve sociale (CERCLE, OFFRE). */
function testimonialTpl(p: CardPayload, w: number, h: number, pad: number, _bg?: string, logo?: string): string {
  const acc = accentColor(p);
  const author = p.authorName
    ? `<div style="display:flex;flex-direction:column;margin-top:44px;">` +
      `<div style="display:flex;width:56px;height:5px;border-radius:3px;background:${acc};margin-bottom:22px;"></div>` +
      `<div style="display:flex;color:${C.blanc};font-size:42px;font-weight:900;font-family:${FONT_BODY};">${esc(p.authorName)}</div>` +
      (p.authorRole
        ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.7)};font-size:32px;font-weight:500;margin-top:10px;font-family:${FONT_BODY};">${esc(p.authorRole)}</div>`
        : '') +
      `</div>`
    : '';
  const inner =
    `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || 'TÉMOIGNAGE', acc) + `</div>` +
    `<div style="display:flex;flex-direction:column;">` +
    `<div style="display:flex;color:${acc};font-size:150px;font-weight:900;line-height:0.6;height:96px;font-family:${FONT_TITLE};">“</div>` +
    titleBlock(p, Math.round(titleSize(p.title, h) * 0.9), C.blanc, acc) +
    author +
    `</div>` +
    footer(p, hexToRgba(C.blanc, 0.9), 'maxmorrys.me', logo);
  return flatShell(w, h, pad, acc, inner);
}

export function buildTemplate(p: CardPayload, w: number, h: number, bgDataUri?: string, logoDataUri?: string): string {
  const pad = Math.round(w * 0.085);
  switch (p.template) {
    case 'tip':
      return tipTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'promo':
      return promoTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'poster':
      return posterTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'panel':
      return panelTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'slide':
      return slideTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'stat':
      return statTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'checklist':
      return checklistTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'versus':
      return versusTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'ask':
      return askTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'testimonial':
      return testimonialTpl(p, w, h, pad, bgDataUri, logoDataUri);
    case 'quote':
    default:
      return quoteTpl(p, w, h, pad, bgDataUri, logoDataUri);
  }
}
