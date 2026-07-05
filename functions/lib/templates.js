"use strict";
/**
 * Templates de cartes réseaux sociaux (HTML/CSS -> Satori).
 * Aligné sur le Brand Kit Max-Morrys (06_Tokens_Design/brand-tokens.json + charte) :
 * titres = Merriweather (serif), corps = Inter ; palette + gradients + radius officiels ;
 * monogramme embarqué. Contrainte Satori : flexbox uniquement, tout div multi-enfants en flex.
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
    brand: C.bleuPrincipal,
    orange: C.orange,
    accent: C.orange,
    violet: C.violet,
    turquoise: C.turquoise,
    corail: C.corail,
    vert: C.vert,
};
const GRAD = {
    institutionnel: `linear-gradient(135deg, ${C.bleuProfond} 0%, ${C.bleuPrincipal} 100%)`,
};
const FONT_TITLE = 'Merriweather'; // serif (titres / accroches)
const FONT_BODY = 'Inter'; // sans (corps, labels, CTA)
function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Merriweather (serif) est plus volumineux : on réduit légèrement la base vs Inter.
function titleSize(text, h) {
    const base = h >= 1900 ? 82 : h >= 1300 ? 70 : 62;
    const len = (text || '').length;
    if (len > 160)
        return Math.round(base * 0.62);
    if (len > 110)
        return Math.round(base * 0.74);
    if (len > 70)
        return Math.round(base * 0.86);
    return base;
}
function accentColor(p) {
    return ACCENTS[p.accent || 'orange'] || C.orange;
}
function shell(w, h, pad, baseBg, contentInner, bgDataUri, scrim = 'rgba(7,43,73,0.7)') {
    const layers = bgDataUri
        ? `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;">` +
            `<img src="${bgDataUri}" width="${w}" height="${h}" style="width:${w}px;height:${h}px;object-fit:cover;" />` +
            `</div>` +
            `<div style="display:flex;position:absolute;top:0;left:0;width:${w}px;height:${h}px;background:${scrim};"></div>`
        : '';
    return (`<div style="display:flex;position:relative;width:${w}px;height:${h}px;background:${baseBg};">` +
        layers +
        `<div style="display:flex;flex-direction:column;justify-content:space-between;position:relative;width:${w}px;height:${h}px;padding:${pad}px;">` +
        contentInner +
        `</div>` +
        `</div>`);
}
/** Pied de carte : monogramme + nom + CTA. */
function footer(p, color, sub, logo) {
    const acc = accentColor(p);
    const logoImg = logo
        ? `<img src="${logo}" width="64" height="64" style="width:64px;height:64px;margin-right:20px;" />`
        : `<div style="display:flex;width:18px;height:18px;border-radius:9px;background:${acc};margin-right:16px;"></div>`;
    const cta = p.cta
        ? `<div style="display:flex;color:${acc};font-size:30px;font-weight:700;font-family:${FONT_BODY};">${esc(p.cta)}</div>`
        : '';
    return (`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">` +
        `<div style="display:flex;align-items:center;">` +
        logoImg +
        `<div style="display:flex;color:${color};font-size:32px;font-weight:700;font-family:${FONT_BODY};">${esc(sub)}</div>` +
        `</div>` +
        cta +
        `</div>`);
}
function quoteTpl(p, w, h, pad, bg, logo) {
    const acc = accentColor(p);
    const inner = `<div style="display:flex;color:${acc};font-size:200px;font-weight:900;line-height:0.7;height:120px;font-family:${FONT_TITLE};">“</div>` +
        `<div style="display:flex;color:${C.blanc};font-size:${titleSize(p.title, h)}px;font-weight:900;line-height:1.18;font-family:${FONT_TITLE};">${esc(p.title)}</div>` +
        footer(p, '#bae0fd', p.body || 'Max-Morrys', logo);
    return shell(w, h, pad, C.bleuProfond, inner, bg, 'rgba(7,43,73,0.74)');
}
function tipTpl(p, w, h, pad, bg, logo) {
    const acc = accentColor(p);
    const body = p.body
        ? `<div style="display:flex;color:${C.texteSecondaire};font-size:40px;font-weight:400;line-height:1.4;margin-top:32px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
        : '';
    const inner = `<div style="display:flex;flex-direction:column;">` +
        `<div style="display:flex;align-self:flex-start;background:${acc};color:${C.blanc};font-size:30px;font-weight:800;padding:12px 28px;border-radius:999px;letter-spacing:2px;font-family:${FONT_BODY};">ASTUCE</div>` +
        `<div style="display:flex;color:${C.bleuProfond};font-size:${titleSize(p.title, h)}px;font-weight:900;line-height:1.16;margin-top:40px;font-family:${FONT_TITLE};">${esc(p.title)}</div>` +
        body +
        `</div>` +
        footer(p, C.texteSecondaire, 'maxmorrys.me', logo);
    return shell(w, h, pad, C.bleuTresClair, inner, bg, 'rgba(0,0,0,0.35)');
}
function promoTpl(p, w, h, pad, bg, logo) {
    const acc = accentColor(p);
    const body = p.body
        ? `<div style="display:flex;color:#e0effe;font-size:42px;font-weight:400;line-height:1.38;margin-top:28px;font-family:${FONT_BODY};">${esc(p.body)}</div>`
        : '';
    const cta = p.cta
        ? `<div style="display:flex;align-self:flex-start;background:${acc};color:${C.bleuProfond};font-size:38px;font-weight:800;padding:24px 52px;border-radius:999px;font-family:${FONT_BODY};">${esc(p.cta)}</div>`
        : '';
    const inner = `<div style="display:flex;flex-direction:column;">` +
        `<div style="display:flex;color:${C.blanc};font-size:${titleSize(p.title, h)}px;font-weight:900;line-height:1.16;font-family:${FONT_TITLE};">${esc(p.title)}</div>` +
        body +
        `</div>` +
        `<div style="display:flex;flex-direction:column;">` +
        cta +
        footer(Object.assign(Object.assign({}, p), { cta: undefined }), '#bae0fd', 'maxmorrys.me', logo) +
        `</div>`;
    return shell(w, h, pad, GRAD.institutionnel, inner, bg, 'rgba(7,43,73,0.55)');
}
/** Construit le markup HTML d'une carte. logoDataUri = monogramme embarqué. */
function buildTemplate(p, w, h, bgDataUri, logoDataUri) {
    const pad = Math.round(w * 0.083); // ~90px sur 1080
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