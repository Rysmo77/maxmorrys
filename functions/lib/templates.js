"use strict";
/**
 * Templates de cartes réseaux sociaux (HTML/CSS -> Satori).
 * Direction « signature courbe de marque » (Brand Kit Max-Morrys) :
 * courbe de croissance bleu→orange (SVG), dégradés de marque, halo radial, Merriweather + Inter,
 * eyebrow (pilier), mot-clé surligné, mode fond-image (photo/IA) avec scrim dégradé.
 * Contrainte Satori : flexbox uniquement, pas de filter/blur/mask ; gradients + <svg> inline OK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTemplate = buildTemplate;
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
const ACCENTS = {
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
function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
}
function titleSize(text, h) {
    const base = h >= 1900 ? 84 : h >= 1300 ? 72 : 64;
    const len = (text || '').length;
    if (len > 150)
        return Math.round(base * 0.6);
    if (len > 100)
        return Math.round(base * 0.72);
    if (len > 64)
        return Math.round(base * 0.85);
    return base;
}
function accentColor(p) {
    return ACCENTS[p.accent || 'orange'] || C.orange;
}
/** Courbe de croissance signature (SVG inline) : trait bleu→orange + aire douce + point de tête. */
function growthCurve(w, h, accent, opacity) {
    const ch = Math.round(h * 0.34);
    const y = (f) => Math.round(ch * f);
    const x = (f) => Math.round(w * f);
    const line = `M0 ${y(0.74)} C ${x(0.30)} ${y(0.82)}, ${x(0.40)} ${y(0.44)}, ${x(0.62)} ${y(0.48)} S ${x(0.9)} ${y(0.12)}, ${w} ${y(0.08)}`;
    const area = `${line} L ${w} ${ch} L 0 ${ch} Z`;
    const svg = `<svg width="${w}" height="${ch}" viewBox="0 0 ${w} ${ch}" xmlns="http://www.w3.org/2000/svg">` +
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
/** Titre Merriweather avec mot-clé surligné (mots de `highlight` passés en accent). */
function titleBlock(p, size, color, accent) {
    const words = (p.title || '').split(/\s+/).filter(Boolean);
    const hl = new Set((p.highlight || '').toLowerCase().split(/\s+/).filter(Boolean));
    const norm = (s) => s.replace(/[.,!?;:«»"'()]/g, '').toLowerCase();
    const rg = Math.round(size * 0.16), cg = Math.round(size * 0.26);
    // Sur fond sombre, un accent bleu ressort mal → surligne en orange pour le peps.
    const hlCol = accent === C.bleuPrincipal ? C.orange : accent;
    const spans = words
        .map((wd) => `<div style="display:flex;color:${hl.has(norm(wd)) ? hlCol : color};">${esc(wd)}</div>`)
        .join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:${rg}px ${cg}px;font-size:${size}px;font-weight:900;line-height:1;font-family:${FONT_TITLE};">${spans}</div>`;
}
function eyebrowBlock(text, accent) {
    if (!text)
        return '';
    return (`<div style="display:flex;align-items:center;">` +
        `<div style="display:flex;width:44px;height:5px;border-radius:3px;background:${accent};margin-right:20px;"></div>` +
        `<div style="display:flex;color:${accent};font-size:28px;font-weight:800;letter-spacing:5px;font-family:${FONT_BODY};">${esc((text || '').toUpperCase())}</div>` +
        `</div>`);
}
function footer(p, color, sub, logo) {
    const acc = accentColor(p);
    const logoImg = logo
        ? `<img src="${logo}" width="60" height="60" style="width:60px;height:60px;margin-right:20px;" />`
        : `<div style="display:flex;width:18px;height:18px;border-radius:9px;background:${acc};margin-right:16px;"></div>`;
    return (`<div style="display:flex;flex-direction:column;">` +
        `<div style="display:flex;width:100%;height:2px;background:${hexToRgba(color === C.texteSecondaire ? C.textePrincipal : C.blanc, 0.14)};margin-bottom:26px;"></div>` +
        `<div style="display:flex;align-items:center;">` +
        logoImg +
        `<div style="display:flex;color:${color};font-size:30px;font-weight:700;font-family:${FONT_BODY};">${esc(sub)}</div>` +
        `</div>` +
        `</div>`);
}
function pill(text, bg, fg) {
    return `<div style="display:flex;align-self:flex-start;background:${bg};color:${fg};font-size:36px;font-weight:800;padding:22px 50px;border-radius:999px;box-shadow:0 12px 30px ${hexToRgba(C.bleuProfond, 0.25)};font-family:${FONT_BODY};">${esc(text)}</div>`;
}
/**
 * Coque : deux modes.
 *  - marque : fond dégradé + halo radial d'accent + courbe.
 *  - image  : photo plein cadre + scrim dégradé bleu + courbe subtile.
 */
function shell(w, h, pad, grad, accent, contentInner, bgUri) {
    let bgLayers;
    if (bgUri) {
        bgLayers =
            `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;">` +
                `<img src="${bgUri}" width="${w}" height="${h}" style="width:${w}px;height:${h}px;object-fit:cover;" /></div>` +
                `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;background:linear-gradient(to top, ${C.bleuProfond} 4%, ${hexToRgba(C.bleuProfond, 0.66)} 44%, ${hexToRgba(C.bleuProfond, 0.14)} 100%);"></div>` +
                growthCurve(w, h, accent, 0.35);
    }
    else {
        bgLayers =
            `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;background:radial-gradient(circle at 82% 14%, ${hexToRgba(accent, 0.42)} 0%, ${hexToRgba(accent, 0)} 52%);"></div>` +
                growthCurve(w, h, accent, 0.55);
    }
    const base = bgUri ? C.bleuProfond : grad;
    return (`<div style="display:flex;position:relative;width:${w}px;height:${h}px;background:${base};">` +
        bgLayers +
        `<div style="display:flex;flex-direction:column;justify-content:space-between;position:relative;width:${w}px;height:${h}px;padding:${pad}px;">` +
        contentInner +
        `</div></div>`);
}
function quoteTpl(p, w, h, pad, bg, logo) {
    const acc = accentColor(p);
    const body = p.body
        ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.82)};font-size:40px;font-weight:400;line-height:1.4;margin-top:34px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
        : '';
    const inner = `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || '', acc) + `</div>` +
        `<div style="display:flex;flex-direction:column;">` +
        `<div style="display:flex;color:${acc};font-size:150px;font-weight:900;line-height:0.6;height:96px;font-family:${FONT_TITLE};">“</div>` +
        titleBlock(p, titleSize(p.title, h), C.blanc, acc) + body +
        `</div>` +
        footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo);
    return shell(w, h, pad, GRAD.institutionnel, acc, inner, bg);
}
function tipTpl(p, w, h, pad, bg, logo) {
    const acc = accentColor(p);
    const body = p.body
        ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.8)};font-size:40px;font-weight:400;line-height:1.42;margin-top:30px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
        : '';
    const inner = `<div style="display:flex;flex-direction:column;">` + pill((p.eyebrow || 'ASTUCE').toUpperCase(), acc, C.blanc) + `</div>` +
        `<div style="display:flex;flex-direction:column;">` +
        titleBlock(p, titleSize(p.title, h), C.blanc, acc) + body +
        `</div>` +
        footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo);
    return shell(w, h, pad, GRAD.innovation, acc, inner, bg);
}
function promoTpl(p, w, h, pad, bg, logo) {
    const acc = accentColor(p);
    const body = p.body
        ? `<div style="display:flex;color:${hexToRgba(C.blanc, 0.85)};font-size:42px;font-weight:400;line-height:1.4;margin-top:28px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
        : '';
    const cta = p.cta ? pill(p.cta, acc, C.bleuProfond) : '';
    const inner = `<div style="display:flex;flex-direction:column;">` + eyebrowBlock(p.eyebrow || '', acc) + `</div>` +
        `<div style="display:flex;flex-direction:column;">` +
        titleBlock(p, titleSize(p.title, h), C.blanc, acc) + body +
        `</div>` +
        `<div style="display:flex;flex-direction:column;">` +
        (cta ? `<div style="display:flex;margin-bottom:34px;">${cta}</div>` : '') +
        footer(p, hexToRgba(C.blanc, 0.85), 'maxmorrys.me', logo) +
        `</div>`;
    return shell(w, h, pad, GRAD.energie, acc, inner, bg);
}
function buildTemplate(p, w, h, bgDataUri, logoDataUri) {
    const pad = Math.round(w * 0.085);
    switch (p.template) {
        case 'tip':
            return tipTpl(p, w, h, pad, bgDataUri, logoDataUri);
        case 'promo':
            return promoTpl(p, w, h, pad, bgDataUri, logoDataUri);
        case 'quote':
        default:
            return quoteTpl(p, w, h, pad, bgDataUri, logoDataUri);
    }
}
//# sourceMappingURL=templates.js.map